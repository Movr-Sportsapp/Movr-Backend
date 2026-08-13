import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();
import User from "../models/User";
import Event from "../models/Event";
import Sport from "../models/Sport";
import { faker } from "@faker-js/faker";

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!, {
    dbName: "movr",
  });

  // 1. Clear existing data so this script is safe to re-run
  await User.deleteMany({});
  await Event.deleteMany({});
  await Sport.deleteMany({});

  const SPORTS = [
  'Running',
  'Cycling',
  'Swimming',
  'Climbing',
  'Football',
  'Basketball',
  'Tennis',
  'Yoga',
  'Hiking',
  'Volleyball',
  'Badminton',
  'CrossFit',
  'Rollerskating',
  ] as const;

  const SKILL_LEVELS = [
    "Beginner",
    "Intermediate",
    "Advanced",
    "Professional",
  ] as const;

  //Predefined locations with fitting coordinates so we dont end up in the middle of nowhere
  type LocationEntry = {
  country: string;
  coordinates: { latitude: number; longitude: number }[];
};

  const LOCATIONS = {
  Berlin: {
    country: "Germany",
    coordinates: [
      { latitude: 52.4750, longitude: 13.4028 }, // Tempelhofer Feld
      { latitude: 52.4800, longitude: 13.2300 }, // Grunewald
    ],
  },
  Hamburg: {
    country: "Germany",
    coordinates: [
      { latitude: 53.5910, longitude: 10.0090 }, // Stadtpark Hamburg
      { latitude: 53.6600, longitude: 10.1100 }, // Duvenstedter Brook
    ],
  },
  "München": {
    country: "Germany",
    coordinates: [
      { latitude: 48.1642, longitude: 11.6050 }, // Englischer Garten
      { latitude: 48.0700, longitude: 11.5900 }, // Perlacher Forst
    ],
  },
  Paris: {
    country: "France",
    coordinates: [
      { latitude: 48.8640, longitude: 2.2500 }, // Bois de Boulogne
      { latitude: 48.8280, longitude: 2.4330 }, // Bois de Vincennes
    ],
  },
  London: {
    country: "UK",
    coordinates: [
      { latitude: 51.5073, longitude: -0.1657 }, // Hyde Park
      { latitude: 51.6500, longitude: 0.0600 },  // Epping Forest
    ],
  },
} satisfies Record<string, LocationEntry>;

// Helper — picks a random city, then a random coordinate pair matching that city
function randomLocation() {
  const cities = Object.keys(LOCATIONS) as (keyof typeof LOCATIONS)[];
  const city = faker.helpers.arrayElement(cities);
  const { country, coordinates } = LOCATIONS[city];
  const coord = faker.helpers.arrayElement(coordinates);

  return {
    city,
    country,
    coordinates: faker.datatype.boolean({ probability: 0.8 }) ? coord : undefined,
  };
}

  function makeSportsInterests(sports: { _id: mongoose.Types.ObjectId }[]) {
    const chosen = faker.helpers.arrayElements(sports, { min: 1, max: 3 });

    return chosen.map((sport) => ({
      sportId: sport._id,
      skillLevel: faker.helpers.arrayElement(SKILL_LEVELS),
    }));
  }
  function shortUsername(maxLen = 20) {
    let name = faker.internet.username();
    while (name.length > maxLen) {
      name = faker.internet.username();
    }
    return name;
  }
  function randomTime() {
    const hour = faker.number.int({ min: 6, max: 22 }); // 6am–10pm, reasonable event hours
    const minute = faker.helpers.arrayElement(["00", "15", "30", "45"]);
    return `${String(hour).padStart(2, "0")}:${minute}`;
  }
  async function makeFakeUsers(
    passwordHash: string,
    sports: { _id: mongoose.Types.ObjectId }[],
  ) {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      username: shortUsername(),
      email: faker.internet.email(),
      passwordHash: passwordHash,
      dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: "age" }),
      gender: faker.helpers.arrayElement([
        "male",
        "female",
        "non-binary",
        "other",
      ]),
      location: randomLocation(),
      profileImage: faker.image.avatar(),
      bio: faker.person.bio(),
      sports: makeSportsInterests(sports),
    };
  }

//Making known Users for us as test Users:
async function makeKnownUsers(
    passwordHash: string,
    sports: { _id: mongoose.Types.ObjectId }[],
  ) {
    return {
      firstName: 'Marla',
      lastName: 'Singer',
      username: 'MarlaS',
      email: 'test@test.com',
      passwordHash: passwordHash,
      dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: "age" }),
      gender: "female",
      location: randomLocation(),
      profileImage: faker.image.avatar(),
      bio: faker.person.bio(),
      sports: makeSportsInterests(sports),
    };
  }

  async function makeFakeEvents(
    users: any[],
    sports: { _id: mongoose.Types.ObjectId; name: string }[],
  ) {
    const sport = faker.helpers.arrayElement(sports);
    return {
      title: `${sport.name} session`,
      description: faker.lorem.lines({ min: 2, max: 5 }),
      sport: sport._id,
      creator: faker.helpers.arrayElement(users)._id,
      location: randomLocation(),
      date: faker.date.soon({ days: 60 }),
      time: randomTime(),
      skillLevel: faker.helpers.arrayElement(SKILL_LEVELS),
      maxParticipants: faker.number.int({ min: 2, max: 12 }),
      participants: { user: faker.helpers.arrayElement(users)._id },
      status: faker.helpers.weightedArrayElement([
        { weight: 80, value: "active" },
        { weight: 10, value: "cancelled" },
        { weight: 10, value: "completed" },
      ]),
      isPublic: faker.datatype.boolean({ probability: 0.15 }), // 15% chance of it being true
      womenOnly: faker.datatype.boolean({ probability: 0.15 }),
      flintaOnly: faker.datatype.boolean({ probability: 0.1 }),
    };
  }

  // Seed Sportcollection to capture real _ids
  const sports = await Sport.insertMany(
    SPORTS.map((name) => ({
      name,
      category: faker.helpers.arrayElement(["Indoor", "Outdoor"]),
    })),
  );

  // 2. Create some users
  const passwordHash = await bcrypt.hash("Password123", 10); // same known password for all seeded users — lets you log in as any of them

  // Test-User with known credentials for us to log in
  const knownUsers = await makeKnownUsers(passwordHash, sports);

  const fakeUsers = await Promise.all(
    Array.from({ length: 13 }).map(() => makeFakeUsers(passwordHash, sports)),
  );

  const users = await User.insertMany([knownUsers, ...fakeUsers]);

  // 3. Create events, referencing the users you just made
  const fakeEvents = await Promise.all(
    Array.from({ length: 13 }).map(() => makeFakeEvents(users, sports)),
  );

  const events = await Event.insertMany(fakeEvents);

  console.log(
    `Seed complete ✅— ${users.length} users, ${events.length} events, ${sports.length} sports`,
  );
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
