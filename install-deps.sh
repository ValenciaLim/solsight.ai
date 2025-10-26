#!/bin/bash

echo "Installing Solana Analytics SaaS dependencies..."

# Install npm dependencies
npm install

# Install additional AI SDK dependencies
npm install @ai-sdk/openai@latest @ai-sdk/react@latest ai@latest

echo "Dependencies installed successfully!"
echo ""
echo "To run the development server:"
echo "npm run dev"
echo ""
echo "Make sure to set up your OpenAI API key in your environment variables:"
echo "OPENAI_API_KEY=your_api_key_here"
