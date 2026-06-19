import { Prisma } from "@prisma/client"

export type FormWithLatestVersion = Prisma.FormGetPayload<{
  include: {
    versions: {
      orderBy: { version: 'desc' }
      take: 1
    }
  }
}>

export type FormWithAllVersions = Prisma.FormGetPayload<{
  include: {
    versions: {
      orderBy: { version: 'desc' },
      include: {
        publishedSchemas: true
      }
    }
  }
}>
