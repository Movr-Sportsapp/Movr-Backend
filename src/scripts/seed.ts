
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { Sport } from '../models/Sport';
import { faker } from '@faker-js/faker';

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);

  // 1. Clear existing data so this script is safe to re-run
  await User.deleteMany({});
  await Event.deleteMany({});
  await Sport.deleteMany({});


const SPORTS = ['climbing', 'bouldering', 'hiking', 'running', 'cycling', 'swimming', 'cricket', 'rollerskating', 'soccer', 'baseball', 'basketball', 'rugby', 'table tennis', 'badminton'] as const;
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'] as const;
const LOCATIONS = [{ city: 'Berlin', country: 'Germany'}, {city: 'Hamburg', country: 'Germany'}, {city: 'München', country: 'Germany'}, {city: 'Vienna', country: 'Austria'}, {city: 'Paris', country: 'France'}, {city: 'London', country: 'UK'}]

function makeSportsInterests(sports: { _id: mongoose.Types.ObjectId }[]) {
    const chosen = faker.helpers.arrayElements(sports, { min: 1, max: 3 });

    return chosen.map((sport) => ({
        sportId: sport._id,
        skillLevel: faker.helpers.arrayElement(SKILL_LEVELS)
    }));
}

async function makeFakeUsers(passwordHash: string, sports: { _id: mongoose.Types.ObjectId }[]) {
	return {
	firstName: faker.person.firstName(),
	lastName: faker.person.lastName(),
	username: faker.internet.username(),
	email: faker.internet.email(),
	password: passwordHash, 
	dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age'}),
	gender: faker.helpers.arrayElement(['male', 'female', 'non-binary', 'other']),
  location: { 
 ...faker.helpers.arrayElement(LOCATIONS),
    coordinates: faker.datatype.boolean({ probability: 0.8 })
    ? { latitude: faker.location.latitude(), longitude: faker.location.longitude() }
    : undefined,
  } ,
    profileImage: faker.image.avatar(),
    bio: faker.person.bio(),
    sports: makeSportsInterests(sports),
};
}

async function makeFakeEvents(users: any[], sports: { _id: mongoose.Types.ObjectId; name: string }[]) {
  const sport = faker.helpers.arrayElement(sports);  
  return {
    title: `${sport.name} session`,
    description: faker.lorem.lines({ min: 2, max: 5}),
    sport: sport._id,
    creator: faker.helpers.arrayElement(users)._id,
     location: { 
    ...faker.helpers.arrayElement(LOCATIONS),
    coordinates: faker.datatype.boolean({ probability: 0.8 })
    ? { latitude: faker.location.latitude(), longitude: faker.location.longitude() }
    : undefined, },
    date: faker.date.soon({ days: 60}),
    skillLevel: faker.helpers.arrayElement(SKILL_LEVELS),
    maxParticipants: faker.number.int({ min: 2, max: 12}) ,
    participants: { user: faker.helpers.arrayElement(users)._id},
    status: faker.helpers.weightedArrayElement([{weight: 80, value: 'active'},{ weight: 10, value: 'cancelled'},{ weight: 10, value: 'completed'}]),
    public: faker.datatype.boolean({ probability: 0.15 }), // 15% chance of it being true
    womenOnly: faker.datatype.boolean({ probability: 0.15 }),
    };
}

// Seed Sportcollection to capture real _ids
const sports = await Sport.insertMany(SPORTS.map((name) => ({ name })));

  // 2. Create some users
  const passwordHash = await bcrypt.hash('password123', 10); // same known password for all seeded users — lets you log in as any of them
	
//  -> If needed add specific users with known credentials for testing purposes
// const knownUsers = await User.insertMany([
// { firstName: 'Marla' ,... }])

  const fakeUsers = await Promise.all(
    Array.from({ length: 10 }).map(() => makeFakeUsers(passwordHash, sports))
  );

  const users = await User.insertMany(fakeUsers);

  // 3. Create events, referencing the users you just made
  const fakeEvents = await Promise.all(
    Array.from({ length: 10}).map(() => makeFakeEvents(users, sports))
  );

  const events = await Event.insertMany(fakeEvents);

  console.log(`Seed complete ✅— ${users.length} users, ${events.length} events, ${sports.length} sports`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});