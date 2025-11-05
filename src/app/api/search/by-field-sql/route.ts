import { POST as byFieldPOST } from '../by-field/route'

export async function POST(req: Request) {
  return byFieldPOST(req)
}


