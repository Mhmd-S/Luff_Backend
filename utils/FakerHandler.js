import Chat from '../models/Chat';
import User from '../models/User';
import Message from '../models/Message';
import { faker } from '@faker-js/faker';

export const populateUsers = async() => {
    for (let i = 0; i < 25; i++) {
        const gender = faker.number.int({ min: 1, max: 2 });
        const gnd =  'Asian,Female'
        const user = new User({
            name: faker.person.fullName({sex:'female'}),
            password: faker.internet.password(),
            email: faker.internet.email(),
            dob: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
            gender:  2,
            orientation: faker.number.int({ min: 1, max: 1 }),
            bio: faker.lorem.paragraph({min: 2, max:3}),
            onboardStep: 2,
            likedUsers: [],
            profilePictures: { 
                            '0': faker.image.urlLoremFlickr({ category: gnd, width:300, heig:600 }), 
                            '1': faker.image.urlLoremFlickr({ category: gnd, width:300, heig:600 }),
                            '2': faker.image.urlLoremFlickr({ category: gnd, width:300, heig:600 }),
                            }
        });
  
        await user.save();
        console.log(`Inserted user ${i + 1}`);
      }
  
}

export const populateChats = async() => {
    const users = await User.find({}, '_id').exec();
    for (let i = 0; i < 20; i++) {
        const chat = new Chat({
            participants: ['658ad7fbca37917399a779ac', users[Math.floor(Math.random() * users.length)]._id],
            messages: [],
            lastMessage: null,
        });
        await chat.save();
        console.log(`Inserted chat ${i + 1}`);
    }
}

export const populateMessages = async() => {
    const chats = await Chat.find().exec();
    for (let i = 0; i < 20; i++) {
        
        const senderid = faker.datatype.boolean() ? '658ad7fbca37917399a779ac' : chats[Math.floor(Math.random() * chats.length)].participants[1];
        
        const chatId = chats[Math.floor(Math.random() * chats.length)]._id;
        
        const message = new Message({
            senderId: senderid,
            recipientId: senderid === '658ad7fbca37917399a779ac' ? chats[Math.floor(Math.random() * chats.length)].participants[1] : '658ad7fbca37917399a779ac',    
            content: faker.lorem.sentence(),
            chatId: chatId,
            seenBy: [senderid],
            createdAt: faker.date.past(),
        });
        await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id, $push: { messages: message._id } }).exec();
        await message.save();
        console.log(`Inserted message ${i + 1}`);
    }
}

export const populateMessagesToChats = async() => {
    const chats = await Chat.find({}, '_id').exec();
    const messages = await Message.find({}, '_id').exec();
    for (let i = 0; i < 20; i++) {
        const chat = await Chat.findById(chats[Math.floor(Math.random() * chats.length)]._id).exec();
        chat.messages.push(messages[Math.floor(Math.random() * messages.length)]._id);
        await chat.save();
        console.log(`Inserted message ${i + 1}`);
    }
}

