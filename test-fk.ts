import "dotenv/config";
import { prisma } from "./src/lib/prisma";

async function testPostMaterials() {
  console.log("Testing POST materials validation...");
  try {
    const agreements = await prisma.agreement.findMany();
    console.log("Existing agreements:", agreements.map(a => ({ id: a.id, title: a.title })));

    const users = await prisma.user.findMany();
    console.log("Existing users:", users.map(u => ({ id: u.id, email: u.email, role: u.role })));
  } catch (e) {
    console.error("Prisma error:", e);
  }
}

testPostMaterials();
