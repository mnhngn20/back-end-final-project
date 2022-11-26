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
import utc from "dayjs/plugin/utc";
import cors from "cors";
import {
  EquipmentResolver,
  LocationResolver,
  RoomResolver,
  UserResolver,
  AuthResolver,
  AmenityTypeResolver,
  AmenityResolver,
  LocationServiceResolver,
  LocationReservationResolver,
  PaymentResolver,
  IncidentCategoryResolver,
  IncidentResolver,
  NotificationResolver,
  StripeResolver,
} from "./resolvers";
import {
  Equipment,
  Location,
  Room,
  ContactInformation,
  User,
  Amenity,
  AmenityType,
  LocationService,
  LocationReservation,
  Payment,
  Incident,
  IncidentCategory,
  Notification,
} from "./entities";
import dayjs from "dayjs";
import Stripe from "stripe";
import bodyParser from "body-parser";
import { handlePayment } from "./services/stripe.service";

dayjs.extend(utc);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2022-08-01",
});

export const dataSource = new DataSource({
  type: "postgres",
  database: process.env.DB_NAME_DEV,
  username: process.env.DB_USERNAME_DEV,
  password: process.env.DB_PASSWORD_DEV,
  host: "localhost",
  port: 5432,
  // ssl: true,
  // url: process.env.DB_URL_PROD,
  // logging: true,
  synchronize: true,
  entities: [
    Equipment,
    Location,
    Room,
    ContactInformation,
    User,
    Amenity,
    AmenityType,
    LocationService,
    LocationReservation,
    Payment,
    Incident,
    IncidentCategory,
    Notification,
  ],
});

const main = async () => {
  const app = express();
  const allowedOrigins = [
    process.env.CORS_ORIGIN_PROD,
    process.env.CORS_ORIGIN_DEV,
    process.env.CORS_ORIGIN_API_PROD,
    process.env.CORS_ORIGIN_API_DEV,
    "http://localhost:3001",
    "http://localhost:4000",
    "http://localhost:3002",
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
        AuthResolver,
        AmenityTypeResolver,
        AmenityResolver,
        LocationServiceResolver,
        LocationReservationResolver,
        PaymentResolver,
        IncidentCategoryResolver,
        IncidentResolver,
        NotificationResolver,
        StripeResolver,
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

  // SECTION: INIT STRIPE WEBHOOK
  app.post(
    "/webhook",
    bodyParser.raw({ type: "application/json" }),
    (request, response) => {
      const payload = request.body;
      const sig = request.headers["stripe-signature"];
      console.log("aaaa1a");

      if (!sig) {
        return response.status(400).send(`Invalid signature`);
      }

      let event;

      try {
        event = stripe.webhooks.constructEvent(
          payload,
          sig,
          process.env.WEBHOOK_SECRET_KEY as string
        );

        const checkoutSession = event.data.object as Stripe.Checkout.Session;

        if (event.type === "checkout.session.completed") {
          if (checkoutSession.metadata?.paymentId) {
            handlePayment(checkoutSession.metadata?.paymentId);
          }
        }
        ``;
      } catch (error) {
        return response.status(400).send(`Webhook error ${error.message}`);
      }

      return response.status(200);
    }
  );

  // SECTION: INIT SERVICES
  console.log(">>> Initializing Firebase FCM...");

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
