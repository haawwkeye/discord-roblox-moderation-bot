import { PrismaClient, User } from '@prisma/client'

const prisma = new PrismaClient()

// Bad idea??
async function getUsers(username:string) {
    let found:User|undefined;
    const list = await prisma.user.findMany();
    list.forEach((user) => {
        if (found) return;
        if (user.username === username) found = user;
    })
    return found;
}

async function makeUser(username:string, password:string) {
    let hasUser = await getUsers(username);
    if (hasUser) throw new Error("A user already uses this username");

    let User = await prisma.user.create({
        data: {
            username: username,
            password: password,
        },
    }).catch((reason) => {
        throw new Error(reason);
    });

    return User;
}

async function deleteUser(username:string) {
    let hasUser = await getUsers(username);
    if (!hasUser) throw new Error("This user doesn't exist");
    
    await prisma.user.delete({
        where: {
            id: hasUser.id
        }
    }).catch((reason) => {
        throw new Error(reason);
    });
    return true;
}

async function main() {
    let user = await makeUser("TestUser", "Testing").catch(() => {});
    console.log(user);
  // ... you will write your Prisma Client queries here
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })