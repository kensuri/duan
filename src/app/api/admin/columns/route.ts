import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Hoặc đường dẫn prisma của bạn

export async function GET() {
  try {
    const columns: any = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'dulieuduan' 
      AND column_name NOT IN ('id', 'createdAt', 'updatedAt', 'createdat', 'updatedat')
      ORDER BY ordinal_position;
    `;

    if (!columns || columns.length === 0) {
      return NextResponse.json({ fields: [], details: [] });
    }

    return NextResponse.json({
      fields: columns.map((c: any) => c.column_name),
      details: columns 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}