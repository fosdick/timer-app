import { Options } from "swagger-jsdoc";

const swaggerOptions: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Timer App Yoga — API",
      version: "1.0.0",
      description:
        "REST API for Timer App Yoga. Serves yoga flow sequences and supporting data " +
        "for the iOS/Android app and web client. Built with Express + TypeScript.",
      contact: {
        name: "Timer App Yoga",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Local development server",
      },
    ],
    tags: [
      {
        name: "Flows",
        description: "Yoga flow sequences — poses, durations, and structure",
      },
      {
        name: "Health",
        description: "Server health and availability",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export default swaggerOptions;
