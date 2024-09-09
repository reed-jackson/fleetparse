import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

import task_recipes from "@/lib/task_recipes.json";

const openai = createOpenAI({
	apiKey: process.env.OPENAI_API_KEY,
	compatibility: "strict",
});

export async function POST(request) {
	const data = await request.json();

	const model = openai("gpt-4o-mini", {
		// additional settings
	});

	const encoder = new TextEncoder();
	const MESSAGE_DELIMITER = "\n---\n";

	const stream = new ReadableStream({
		async start(controller) {
			try {
				const sendMessage = async (type, data) => {
					const message = JSON.stringify({ type, data });
					console.log("sending back: " + message);
					controller.enqueue(encoder.encode(message + MESSAGE_DELIMITER));

					// Add a small delay after sending each message
					await new Promise((resolve) => setTimeout(resolve, 50));
				};

				// We create a system prompt that tells the model what to do, and provides structures to their response
				const system_prompt = `You are FleetParse, a backend AI agent that assists Fleetio customers with their Fleetio data.

               Fleetio is a fleet management software that allows users to manage their fleet of vehicles, drivers, and assets. This includes things like tracking vehicle information, preventative maintenance scheudles, usage, and more.
               
               You will be given information from the Fleetio user, and your job is to determine what taks they need you to perform, and then perform that task.
               
               You are a backend bot, and only respond in JSON format.`;

				// We create a messages array that will be used to send the user's input to the model, and iterate as the agent works their way through the task
				const generation_messages = [
					{
						role: "user",
						content: [
							{
								type: "text",
								text: `A user has provided you with the following message: ${data.message}.

                        Use the following Schema as your response: 

                        {
                           'task': 'create_record' || 'update_record' || 'delete_record' || null,
                           'message': string // In a brief sentence, describe what the user is asking you to complete
                        }
                        
                        First, you must determine if the information they've provided is a request for you to perform a task.
                        
                        If the user message is not a request for you to perform a task, respond with 'null' in the task key and provide the user a message describing why you were unable to determine a task for them.
                        
                        if the user message is a request for you to perform a task, respond with the task key and provide a message describing what you'll do for the user.`,
							},
						],
					},
				];

				const { text } = await generateText({
					model: model,
					system: system_prompt,
					messages: generation_messages,
				});

				const check_data = JSON.parse(text);

				console.log(check_data);

				await sendMessage("message", check_data);

				// We close the interaction if no task was determined
				if (!check_data.task) {
					controller.close();
					return;
				}

				// Push the agent's message to the messages array so they can see what they're saying
				generation_messages.push({
					role: "assistant",
					content: text,
				});

				// Task confirmed, Find task recipe
				// We'll go to a library of task recipes and ask the agent to determine the best recipe for the task, given the user's request

				generation_messages.push(
					{
						role: "user",
						content: `Using the recipe list below, determine the best recipe for the task.
                  
                  Return a JSON object with the schema below as your response:
                  
                  {
                     "recipe": "recipe_name" // The name of the recipe to use, which is the key to the recipe in the list
                     "adequate_data": true || false // true if the recipe has all the data it needs to complete the task, false if it does not
                     "missing_data": string || null // A description of the data that is missing, or null if the recipe has all the data it needs
                     "message": string // A message to the user describing your progress in this step. Do not use backend language (like snake case names).
                  }`,
					},
					{
						role: "user",
						content: JSON.stringify(task_recipes),
					}
				);

				console.log(generation_messages);

				const { text: recipe_identification } = await generateText({
					model: model,
					system: system_prompt,
					messages: generation_messages,
				});

				console.log(recipe_identification);

				// Send a message back to the user with the response
				await sendMessage("object", recipe_identification);

				// Push the agent's message to the messages array
				generation_messages.push({
					role: "assistant",
					content: recipe_identification,
				});

				// Now, we'll reference the recipe to get the schema and infomration needed to complete the task
				const recipe_name = JSON.parse(recipe_identification).recipe;
				const schema_reference = task_recipes[recipe_name].schema_reference;
				const prompt = task_recipes[recipe_name].prompt;

				// TODO: Send the schema as a new assistant message, then follow up with the recipe prompt. This will generate the record, which we will send back to the client.

				controller.close();
				return;

				generation_messages.push({
					role: "user",
					content: `Now, explain any specific methodologies or steps that you'd expect would contribute to the creation of this dish. Format your response in Markdown.`,
				});

				const { text: steps } = await generateText({
					model: model,
					system: system_prompt,
					messages: generation_messages,
				});

				const steps_data = steps;

				await sendMessage("step", steps_data);

				// Proceed with recipe
				generation_messages.push({
					role: "assistant",
					content: steps,
				});

				const recipe_generation_prompt = {
					role: "user",
					content: `Now, create a recipe based on what you've determined from the image and what we've talked through.
         
         Output in JSON format with keys: 
            "title” (text),
            "description" (text - a creative description of your recipe),
            “ingredients” (array of objects with keys: "name" (text), "detail" (text - optional additional description for the ingredient || null), "category" ("pantry" || "produce" || "meat" || "seafood" || "frozen" || "dairy", "other"), "standard_measure" (text), "metric_measure" (text)),
            "steps" (array of objects with keys: "title" (text), "content" (text))`,
				};

				generation_messages.push(recipe_generation_prompt);

				const { text: recipe_text } = await generateText({
					model: model,
					system: system_prompt,
					messages: generation_messages,
				});

				const recipe_data = JSON.parse(recipe_text);

				recipe_data.main_image = imageUrl;

				await sendMessage("recipe", recipe_data);

				const json_ld = createJsonLd(recipe_data);

				const generation_data = {
					check: check_data,
					ingredients: ingredients_data,
					steps: steps_data,
					additionalInfo: additionalInfo,
				};

				controller.close();
			} catch (error) {
				const safeErrorMessage = error.message.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
				controller.enqueue(encoder.encode(JSON.stringify({ type: "error", message: safeErrorMessage })));
				controller.close();
			}
		},
	});

	return new Response(stream);
}
