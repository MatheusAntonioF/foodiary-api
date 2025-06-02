import {
    APIGatewayProxyEventV2,
    type APIGatewayProxyResultV2,
} from "aws-lambda";
import { lambdaBodyParser } from "../utils/lambdaBodyParser";
import type { Controller } from "../../application/contracts/Controller";
import { ZodError } from "zod";
import { ErrorCode } from "../../application/errors/ErrorCode";
import { lambdaErrorResponse } from "../utils/lambdaErrorResponse";
import { HttpError } from "../../application/errors/http/HttpError";

export function lambdaHttpAdapter(controller: Controller<unknown>) {
    return async (
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResultV2> => {
        try {
            const body = lambdaBodyParser(event.body);
            const params = event.pathParameters ?? {};
            const queryParams = event.queryStringParameters ?? {};

            const response = await controller.execute({
                body,
                params,
                queryParams,
            });

            return {
                statusCode: response.statusCode,
                body: response.body ? JSON.stringify(response.body) : undefined,
            };
        } catch (error) {
            if (error instanceof ZodError) {
                return lambdaErrorResponse({
                    statusCode: 400,
                    code: ErrorCode.VALIDATION,
                    message: error.issues.map((issue) => ({
                        field: issue.path.join("."),
                        error: issue.message,
                    })),
                });
            }

            if (error instanceof HttpError) {
                return lambdaErrorResponse(error);
            }

            return lambdaErrorResponse({
                statusCode: 500,
                code: ErrorCode.INTERNAL_SERVER_ERROR,
                message: "Internal server error",
            });
        }
    };
}
