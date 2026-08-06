
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { faker } from '@faker-js/faker';

const SPORTS = ['climbing', 'bouldering', 'hiking', 'running', 'cycling', 'swimming', 'cricket', 'rollerskating', 'soccer', 'baseball', 'basketball', 'rugby', 'table tennis', 'badminton'] as const;
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Open to all levels'] as const;

function makeSportsInterests() {
    const sports = faker.helpers.arrayElements(SPORTS, { min: 1, max: 3 });

    return sports.map((sport) => ({
        sport,
        skillLevel: faker.helpers.arrayElement(SKILL_LEVELS)
    }));
}

async function makeFakeUsers(passwordHash: string) {
	return {
	firstName: faker.person.firstName(),
	lastName: faker.person.lastName(),
	username: faker.internet.username(),
	email: faker.internet.email(),
	password: passwordHash, 
	dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age'}),
	gender: faker.helpers.arrayElement(['male', 'female', 'non-binary', 'other']),
    city: faker.location.city(),
    profilePicture: faker.image.avatar(),
    bio: faker.person.bio(),
    sportsInterests: makeSportsInterests(),
};
}

async function makeFakeEvents() {
    return {
    title: `${faker.helpers.arrayElement(SPORTS)} session`,


    };
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);

  // 1. Clear existing data so this script is safe to re-run
  await User.deleteMany({});
  await Event.deleteMany({});

  // 2. Create some users
  const passwordHash = await bcrypt.hash('password123', 10); // same known password for all seeded users — lets you log in as any of them
	
//  -> If needed add specific users with known credentials for testing purposes
// const knownUsers = await User.insertMany([
// { firstName: 'Marla' ,... }])


  const fakeUsers = await Promise.all(
    Array.from({ length: 10 }).map(() => makeFakeUsers(passwordHash))
  );

  const users = await User.insertMany(fakeUsers);

  // 3. Create events, referencing the users you just made
  const events = await Event.insertMany(fakeEvents);

  console.log('Seed complete ✅');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});