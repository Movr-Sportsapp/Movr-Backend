
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { faker } from '@faker-js/faker';

const SPORTS = ['climbing', 'bouldering', 'hiking', 'running', 'cycling', 'swimming', 'cricket', 'rollerskating', 'soccer', 'baseball', 'basketball', 'rugby', 'table tennis', 'badminton'] as const;
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'open for all'] as const;

function makeSportsInterests() {
    const sports = faker.helpers.arrayElements(SPORTS, { min: 1, max: 3 });

    return sports.map((sport) => ({
        sport,
        skillLevel: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced'])
    }));
}

async function makeFakeUsers() {
	return {
	firstName: faker.person.firstName(),
	lastName: faker.person.lastName(),
	username: faker.internet.username(),
	email: faker.internet.email(),
	password: await bcrypt.hash('password123', 10), // same known password for all seeded users — lets you log in as any of them
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



    };
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);

  // 1. Clear existing data so this script is safe to re-run
  await User.deleteMany({});
  await Event.deleteMany({});

  // 2. Create some users
  const passwordHash = await bcrypt.hash('password123', 10);
	
  

	
  const users = await User.insertMany(
	Array.from({ length: 10 }).map(() => ({
	

  );

  // 3. Create events, referencing the users you just made
  await Event.insertMany([
    {
      title: 'Sunday morning climbing',
      sport: 'climbing',
      creator: users[0]._id,
      city: 'Berlin',
      dateTime: new Date('2026-08-10T09:00:00.000Z'),
      maxParticipants: 6,
      public: true,
    },
    // ...more events
  ]);

  console.log('Seed complete ✅');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});