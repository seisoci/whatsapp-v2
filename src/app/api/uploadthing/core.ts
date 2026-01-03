import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

const auth = (req: Request) => ({ id: 'fakeId' });

export const ourFileRouter = {
  avatar: f({ image: { maxFileSize: '4MB' } })
    .middleware(({ req }) => auth(req))
    .onUploadComplete((data) => console.log('file', data)),

  generalMedia: f({
    'application/pdf': { maxFileSize: '4MB', maxFileCount: 4 },
    image: { maxFileSize: '2MB', maxFileCount: 4 },
    video: { maxFileSize: '256MB', maxFileCount: 1 },
  })
    .middleware(({ req }) => auth(req))
    .onUploadComplete((data) => console.log('file', data)),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
