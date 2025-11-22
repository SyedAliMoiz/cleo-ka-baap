# Setting Up the News API Feature

This document explains how to set up the News API functionality in the Automated Content Engine.

## Getting a News API Key

The application uses NewsAPI.org as a replacement for Google News API. To obtain an API key:

1. Visit [https://newsapi.org/register](https://newsapi.org/register)
2. Fill out the registration form with your details
3. Submit the form to receive your API key
4. Copy the API key for configuration

## Configuring the API Key

Once you have obtained your API key, follow these steps to configure it:

1. Create a `.env` file in the backend directory if it doesn't already exist
2. Add the following line to your `.env` file:
   ```
   GOOGLE_NEWS_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with the actual API key you received

## Usage Notes

- The free tier of NewsAPI allows up to 100 requests per day
- For development purposes, this should be sufficient
- For production use, you may need to upgrade to a paid plan
- The API endpoints in the code are already configured correctly

## Troubleshooting

If you encounter issues with the News API:

1. Verify that your API key is correctly added to the `.env` file
2. Check that the backend is properly loading the environment variables
3. Review the NewsAPI.org documentation for any usage limitations

For more information, visit [https://newsapi.org/docs](https://newsapi.org/docs). 