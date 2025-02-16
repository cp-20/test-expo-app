import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";

const bucket = process.env.EXPO_PUBLIC_CLOUDFLARE_R2_BUCKET as string;

const client = new S3Client({
  region: "auto",
  endpoint: process.env.EXPO_PUBLIC_CLOUDFLARE_R2_ENDPOINT as string,
  credentials: {
    accessKeyId: process.env.EXPO_PUBLIC_CLOUDFLARE_R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env
      .EXPO_PUBLIC_CLOUDFLARE_R2_SECRET_ACCESS_KEY as string,
  },
});

export const putImage = async (file: File, type: string, pathname: string) => {
  const uploadParams: PutObjectCommandInput = {
    Bucket: bucket,
    Key: pathname,
    Body: file,
    ContentType: type,
  };

  const command = new PutObjectCommand(uploadParams);
  try {
    await client.send(command);
  } catch (err) {
    console.log(err);
  }

  return `${process.env.EXPO_PUBLIC_CLOUDFLARE_R2_ENDPOINT}/${pathname}`;
};

export const deleteImage = async (pathname: string) => {
  const uploadParams: DeleteObjectCommandInput = {
    Bucket: bucket,
    Key: pathname,
  };

  const command = new DeleteObjectCommand(uploadParams);
  return client.send(command);
};
