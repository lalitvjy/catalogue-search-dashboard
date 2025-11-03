import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export interface R2UploadResult {
  url: string
  key: string
}

function createR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID || "ee99e9f65c6e9111533bc891baa8663b"
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || "e13682d284143fcdcd92a3f615a6196a"
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "595b16114baebd6b7a1533e941e3ac2e6bc0d063d1f9cf0f95f366398e201840"
  const endpoint = accountId ? `https://${accountId}.r2.cloudflarestorage.com` : process.env.R2_ENDPOINT

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured')
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  })
}

export async function uploadBufferToR2(params: {
  bucket: string
  key: string
  contentType: string
  body: Buffer | Uint8Array | string
  publicBaseUrl?: string
}): Promise<R2UploadResult> {
  const client = createR2Client()

  await client.send(new PutObjectCommand({
    Bucket: params.bucket,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
    ACL: 'public-read'
  }))

  const base = params.publicBaseUrl || process.env.R2_PUBLIC_BASE_URL || "https://pub-2035eb04f1c6419f9f5608d56b4df5d8.r2.dev"
  const url = base ? `${base.replace(/\/$/, '')}/${params.key}` : `${process.env.R2_CDN_BASE_URL?.replace(/\/$/, '') || ''}/${params.key}`

  return { url, key: params.key }
}


