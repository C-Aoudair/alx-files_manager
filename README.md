# Files Manager

Files Manager is an Express application for managing user files with support for file uploads, retrieval, and basic user authentication. It uses Redis for session management and MongoDB for data storage.

## Table of Contents

- [Description](#description)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [License](#license)

## Description

Files Manager allows users to:

- Upload and manage files.
- Authenticate and manage user sessions.
- Perform operations on files such as publish/unpublish and retrieving file details.

## Installation

1. Clone the repository from the provided URL.
2. Navigate to the project directory.
3. Install dependencies using your package manager.
4. Create a `.env` file in the root directory with the required environment variables (see [Environment Variables](#environment-variables)).
5. Start the application using your package manager.

## Usage

- **Start the server**: The application runs on port `5000` by default. You can change this by setting the `PORT` environment variable.
- **API Endpoints**: Refer to the [API Documentation](#api-documentation) for details on available endpoints.

## API Documentation

### Status

- **GET /status**
  - Returns the status of Redis and MongoDB connections.

### Statistics

- **GET /stats**
  - Returns the number of users and files in the database.

### Users

- **POST /users**
  - Create a new user with email and password.
- **GET /users/me**
  - Retrieve the currently authenticated user’s details.

### Authentication

- **GET /connect**
  - Authenticate a user and return a session token.
- **GET /disconnect**
  - Log out a user by invalidating the session token.

### Files

- **POST /files**
  - Upload a new file.
- **GET /files/:id**
  - Retrieve details of a specific file.
- **GET /files**
  - List files with optional pagination and parent folder filtering.
- **GET /files/:id/data**
  - Retrieve the content of a specific file.
- **PUT /files/:id/publish**
  - Publish a file making it publicly accessible.
- **PUT /files/:id/unpublish**
  - Unpublish a file making it private.

## Environment Variables

- `PORT`: Port on which the server will run (default: `5000`).
- `DB_HOST`: MongoDB host (default: `localhost`).
- `DB_PORT`: MongoDB port (default: `27017`).
- `DB_DATABASE`: MongoDB database name (default: `files_manager`).
- `FOLDER_PATH`: Path to store files (default: `/tmp/files_manager`).

## Dependencies

- `express`: Web framework for Node.js.
- `mongodb`: MongoDB driver for Node.js.
- `redis`: Redis client for Node.js.
- `bull`: Queue library for job processing.
- `sha1`: SHA1 hash library.
- `uuid`: Library for generating UUIDs.
- `mime-types`: Library for MIME type utilities.
- `image-thumbnail`: Library for creating image thumbnails.
- `punycode`: Library for encoding/decoding Unicode.
