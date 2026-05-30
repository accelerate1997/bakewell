import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { writeFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Initialize the S3 Client for Cloudflare R2 / AWS S3
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const normalizedRole = userRole?.toUpperCase();
    const isAuthorized = normalizedRole === "ADMIN" || normalizedRole === "STAFF";

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    let buffer: any = Buffer.from(await file.arrayBuffer());
    let filename = file.name;
    let contentType = file.type;

    // Check if the uploaded file is an image
    const isImage = contentType.startsWith('image/');

    if (isImage) {
      try {
        // Compress and convert the image to WebP using sharp
        buffer = await sharp(buffer)
          .webp({ quality: 80 })
          .toBuffer();
        
        // Replace the file extension in filename with .webp
        const ext = path.extname(filename);
        if (ext) {
          filename = filename.slice(0, -ext.length) + '.webp';
        } else {
          filename = filename + '.webp';
        }
        contentType = 'image/webp';
      } catch (sharpError) {
        console.error('Image compression/WebP conversion error (falling back to raw):', sharpError);
      }
    }

    const cleanFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueFilename = `${Date.now()}-${cleanFilename}`;

    // Verify if Cloud Storage R2/S3 credentials are fully set
    const isR2Configured =
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_ENDPOINT &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL;

    if (isR2Configured) {
      // Upload to R2 Bucket
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: uniqueFilename,
          Body: buffer,
          ContentType: contentType,
        })
      );

      const url = `${process.env.R2_PUBLIC_URL}/${uniqueFilename}`;
      return NextResponse.json({ success: true, url });
    } else {
      // Fallback Mode: Write the optimized file to local uploads directory
      console.warn('R2/S3 credentials not fully configured, writing to fallback local storage.');
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');

      try {
        await writeFile(path.join(uploadDir, uniqueFilename), buffer);
      } catch (e: any) {
        if (e.code === 'ENOENT') {
          const fs = await import('fs');
          fs.mkdirSync(uploadDir, { recursive: true });
          await writeFile(path.join(uploadDir, uniqueFilename), buffer);
        } else {
          throw e;
        }
      }

      const url = `/uploads/${uniqueFilename}`;
      return NextResponse.json({ success: true, url });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
