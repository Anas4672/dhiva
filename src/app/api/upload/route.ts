import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getToken } from 'next-auth/jwt';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

export async function POST(req: Request) {
  try {
    // 1. Authenticate user - only logged in users can upload files
    const token = await (getToken as any)({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'dhivacourse';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 3. File validation
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} is not supported. Please upload an image, PDF, or MP4 video.` },
        { status: 400 }
      );
    }

    // Size limit - 15MB for free tier Cloudinary serverless upload to prevent timeouts
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 15MB limit.' },
        { status: 400 }
      );
    }

    // 4. Convert file to buffer and base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = `data:${file.type};base64,${buffer.toString('base64')}`;

    // 5. Upload to Cloudinary
    console.log(`Uploading file of type ${file.type} to Cloudinary...`);
    const uploadResponse = await cloudinary.uploader.upload(base64File, {
      folder: folder,
      resource_type: file.type.startsWith('video/') ? 'video' : 'auto',
    });

    return NextResponse.json({
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
      bytes: uploadResponse.bytes,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during file upload.' },
      { status: 500 }
    );
  }
}
