import { Controller } from "@application/contracts/Controller";
import { ApplicationError } from "@application/errors/application/ApplicationError";
import { ErrorCode } from "@application/errors/ErrorCode";
import { HttpError } from "@application/errors/http/HttpError";
import { lambdaBodyParser } from "@main/utils/lambdaBodyParser";
import { lambdaErrorResponse } from "@main/utils/lambdaErrorResponse";
import type {
    APIGatewayProxyEventV2,
    APIGatewayProxyEventV2WithJWTAuthorizer,
    APIGatewayProxyResultV2,
} from "aws-lambda";
import { ZodError } from "zod";

type Event = APIGatewayProxyEventV2 | APIGatewayProxyEventV2WithJWTAuthorizer;

export function lambdaHttpAdapter(controller: Controller<unknown>) {
    return async (event: Event): Promise<APIGatewayProxyResultV2> => {
        try {
            const body = lambdaBodyParser(event.body);
            const params = event.pathParameters ?? {};
            const queryParams = event.queryStringParameters ?? {};

            if ("authorizer" in event.requestContext) {
                console.log(
                    JSON.stringify(event.requestContext.authorizer.jwt, null, 2)
                );
            }

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

            if (error instanceof ApplicationError) {
                return lambdaErrorResponse({
                    statusCode: error.statusCode ?? 400,
                    code: error.code,
                    message: error.message,
                });
            }

            if (error instanceof HttpError) {
                return lambdaErrorResponse(error);
            }

            console.error(error);

            return lambdaErrorResponse({
                statusCode: 500,
                code: ErrorCode.INTERNAL_SERVER_ERROR,
                message: "Internal server error",
            });
        }
    };
}
