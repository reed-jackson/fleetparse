"use client";

import { useState, useEffect, useRef } from "react";
import { Container, Heading, TextArea, Button, Box, Text } from "@radix-ui/themes";

export default function Home() {
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleInputChange = (e) => {
		setInput(e.target.value);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!input.trim()) return;

		setIsLoading(true);
		setMessages((prev) => [...prev, { role: "user", content: input }]);
		setInput("");

		try {
			const response = await fetch("/api/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: input }),
			});

			if (!response.ok) throw new Error("Network response was not ok");

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const messages = buffer.split("\n---\n");

				// Process all complete messages
				for (let i = 0; i < messages.length - 1; i++) {
					const message = messages[i].trim();
					if (message) {
						``;
						const { type, data } = JSON.parse(message);

						if (type === "message") {
							setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
						} else if (type === "object") {
							setMessages((prev) => [...prev, { role: "assistant", content: JSON.parse(data).message }]);
						}
					}
				}

				// Keep the last incomplete message in the buffer
				buffer = messages[messages.length - 1];
			}

			// Process any remaining data in the buffer
			if (buffer.trim()) {
				const { type, data } = JSON.parse(buffer.trim());
				setMessages((prev) => [...prev, { role: "assistant", content: JSON.stringify(data) }]);
			}
		} catch (error) {
			console.error("Error:", error);
			setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, an error occurred. Please try again." }]);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		console.log(messages);
	}, [messages]);

	return (
		<Container size="2" pt={"9"}>
			<Heading size={"7"} mb="4">
				FleetParse
			</Heading>

			<form onSubmit={handleSubmit}>
				<TextArea placeholder="Type your message here" size={"3"} mb="2" value={input} onChange={handleInputChange} />
				<Button type="submit" disabled={isLoading}>
					{isLoading ? "Sending..." : "Send"}
				</Button>
			</form>

			<Box mt="4">
				{messages.map((message, index) => (
					<Box key={index} mb="2">
						<Text as="p" weight={message.role === "user" ? "bold" : "regular"}>
							{message.role === "user" ? "You: " : "FleetParse: "}

							{message.role === "user" ? message.content : message.content}
						</Text>
					</Box>
				))}
				<div ref={messagesEndRef} />
			</Box>
		</Container>
	);
}
