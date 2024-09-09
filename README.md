# FleetParse Demo

FleetParse is a mini-app that demonstrates AI-powered assistance for Fleetio customers. It helps users manage their fleet data by interpreting natural language requests and performing tasks such as creating service entries, fuel entries, and meter entries.

## Features

- AI-powered natural language processing
- Seamless integration with Fleetio data structures
- Real-time streaming responses
- User-friendly chat interface

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/your-username/fleetparse-demo.git
   cd fleetparse-demo
   ```

2. Install dependencies:

   ```
   npm install
   ```

   or

   ```
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

### Running the app

1. Start the development server:

   ```
   npm run dev
   ```

   or

   ```
   yarn dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Type your request in the text area (e.g., "Add a service entry for vehicle XYZ-123 with an oil change at 50,000 miles, costing $75")
2. Click the "Send" button or press Enter
3. The AI will process your request and provide a response, potentially creating or updating records in the Fleetio system

## Tech Stack

- Next.js 14
- React 18
- Radix UI for components
- Tailwind CSS for styling
- OpenAI GPT-4 for natural language processing

## Project Structure

- `app/`: Next.js app directory
- `app/page.js`: Main chat interface
- `app/api/generate/route.js`: API route for AI processing
- `lib/`: Utility functions and data
- `lib/task_recipes.json`: Definitions for various tasks the AI can perform
- `lib/schemas.json`: JSON schemas for data structures

## Contributing

If you'd like to contribute to this project, please fork the repository and create a pull request with your changes.
