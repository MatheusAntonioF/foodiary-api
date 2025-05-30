import { APIGatewayProxyEventV2 } from "aws-lambda";

import { HelloController } from "../../application/controllers/HelloController";
import { lambdaBodyParser } from "../utils/lambdaBodyParser";

const controller = new HelloController();

export async function handler(event: APIGatewayProxyEventV2) {
    const body = lambdaBodyParser(event.body);
    const params = event.pathParameters ?? {};
    const queryParams = event.queryStringParameters ?? {};

    return controller.handle({ body, params, queryParams });
}
