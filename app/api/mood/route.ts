import {
  DELETE as deleteHandler,
  GET as getHandler,
  PATCH as patchHandler,
  POST as postHandler,
} from '@backend/api/mood/route'

export const GET = getHandler
export const PATCH = patchHandler
export const POST = postHandler
export const DELETE = deleteHandler
