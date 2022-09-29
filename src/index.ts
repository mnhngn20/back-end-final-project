require("dotenv").config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import "reflect-metadata";
import express from "express";
import { DataSource } from "typeorm";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { __prod__ } from "./constants";
import { Context } from "./types/Context";
import cors from "cors";
import {
  EquipmentResolver,
  LocationResolver,
  RoomResolver,
  UserResolver,
} from "./resolvers";
import {
  Equipment,
  Location,
  Room,
  ContactInformation,
  User,
} from "./entities";
import NotificationHelper from "./utils/common/notificationHelper";

const dataSource = new DataSource({
  type: "postgres",
  database: "final-project",
  username: process.env.DB_USERNAME_DEV,
  password: process.env.DB_PASSWORD_DEV,
  // ssl: true,
  // url: process.env.DB_URL_PROD,
  logging: false,
  synchronize: true,
  entities: [Equipment, Location, Room, ContactInformation, User],
});

const main = async () => {
  const app = express();
  const allowedOrigins = [
    process.env.CORS_ORIGIN_PROD,
    process.env.CORS_ORIGIN_DEV,
    process.env.CORS_ORIGIN_API_PROD,
    process.env.CORS_ORIGIN_API_DEV,
    "https://www.supercode.co.za",
  ];
  const corsOptions: cors.CorsOptions = {
    origin: function (origin, callback) {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        let msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  };
  app.use(cors(corsOptions));

  //SECTION: CONNECT POSTGRESQL
  console.log(">>> Connecting postgreSQL");
  await dataSource.initialize();

  // SECTION: CONFIGURE GRAPHQL SERVER
  console.log(">>> Configuring graphql");
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [
        EquipmentResolver,
        LocationResolver,
        RoomResolver,
        UserResolver,
      ],
      validate: false,
    }),
    context: ({ req, res }): Context => ({ req, res }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
    introspection: true,
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({
    app,
    path: "/graphql",
    cors: corsOptions,
  });

  // SECTION: INIT SERVICES
  console.log(">>> Initializing Firebase FCM...");
  NotificationHelper.init();

  // SECTION: START EXPRESS SERVER
  console.log(">>> Starting server...");
  const PORT = process.env.PORT || 4000;
  const URL = `http://localhost:${PORT}${apolloServer.graphqlPath}`;
  app.listen(PORT, () =>
    console.log(
      `   - Server started on port ${PORT}. GraphQL server started on ${URL}`
    )
  );
};

main().catch((err) => console.error(err));
