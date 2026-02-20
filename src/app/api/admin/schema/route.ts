import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { action, oldKey, newKey, type } = await req.json();

    if (action === "ADD_COLUMN") {
      const sql = `ALTER TABLE "dulieuduan" ADD COLUMN "${newKey}" ${mapType(type)};`;
      await prisma.$executeRawUnsafe(sql);
    } 
    else if (action === "RENAME_COLUMN") {
      const sql = `ALTER TABLE "dulieuduan" RENAME COLUMN "${oldKey}" TO "${newKey}";`;
      await prisma.$executeRawUnsafe(sql);
    }
    else if (action === "DELETE_COLUMN") {
      const sql = `ALTER TABLE "dulieuduan" DROP COLUMN "${oldKey}";`;
      await prisma.$executeRawUnsafe(sql);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function mapType(type: string) {
  if (type === "Number") return "DECIMAL";
  if (type === "Date") return "TIMESTAMP";
  return "TEXT";
}