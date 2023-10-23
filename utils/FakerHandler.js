import User from "../models/User.js";
import { faker } from '@faker-js/faker';

export const populateUsers = async() => {
    for (let i = 0; i < 100; i++) {
        const user = new User({
            name: faker.person.fullName(),
            password: faker.internet.password(),
            email: faker.internet.email(),
            dob: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
            gender: faker.person.sexType(),
            orientation: faker.person.sexType(),
            bio: faker.person.bio(),
            onboardStep: 2,
        });
  
        await user.save();
        console.log(`Inserted user ${i + 1}`);
      }
  
}