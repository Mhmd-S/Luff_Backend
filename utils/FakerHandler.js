import Chat from '../models/Chat';
import User from '../models/User';
import Message from '../models/Message';
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

export const populateChats = async() => {
    const users = await User.find({}, '_id').exec();
    for (let i = 0; i < 100; i++) {
        const chat = new Chat({
            participants: ['652c9907d5f4faaccd2e0ab0', users[Math.floor(Math.random() * users.length)]._id],
            messages: [],
        });
        await chat.save();
        console.log(`Inserted chat ${i + 1}`);
    }
}

export const populateMessages = async() => {
    const chats = await Chat.find().exec();
    for (let i = 0; i < 500; i++) {
        
        const senderid = faker.datatype.boolean() ? '652c9907d5f4faaccd2e0ab0' : chats[Math.floor(Math.random() * chats.length)].participants[1];
        
        const chatId = chats[Math.floor(Math.random() * chats.length)]._id;
        
        const message = new Message({
            senderId: senderid,
            recipientId: senderid === '652c9907d5f4faaccd2e0ab0' ? chats[Math.floor(Math.random() * chats.length)].participants[1] : '652c9907d5f4faaccd2e0ab0',    
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
    for (let i = 0; i < 500; i++) {
        const chat = await Chat.findById(chats[Math.floor(Math.random() * chats.length)]._id).exec();
        chat.messages.push(messages[Math.floor(Math.random() * messages.length)]._id);
        await chat.save();
        console.log(`Inserted message ${i + 1}`);
    }
}

