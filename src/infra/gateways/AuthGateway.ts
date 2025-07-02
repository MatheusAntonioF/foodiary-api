import {
    ConfirmForgotPasswordCommand,
    ForgotPasswordCommand,
    GetTokensFromRefreshTokenCommand,
    InitiateAuthCommand,
    SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { Injectable } from "@kernel/decorators/Injectable";
import { cognitoClient } from "../clients/cognitoClient";
import { AppConfig } from "@shared/config/AppConfig";
import { createHmac } from "node:crypto";

@Injectable()
export class AuthGateway {
    constructor(private readonly appConfig: AppConfig) {}

    async signIn({
        email,
        password,
    }: AuthGateway.SignInParams): Promise<AuthGateway.SignInResult> {
        const command = new InitiateAuthCommand({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: this.appConfig.auth.cognito.clientId,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
                SECRET_HASH: this.getSecretHash(email),
            },
        });

        const { AuthenticationResult } = await cognitoClient.send(command);

        if (
            !AuthenticationResult?.AccessToken ||
            !AuthenticationResult?.RefreshToken
        ) {
            throw new Error(`Cannot authenticate user: ${email}`);
        }

        return {
            accessToken: AuthenticationResult.AccessToken,
            refreshToken: AuthenticationResult.RefreshToken,
        };
    }

    async signUp({
        email,
        password,
        internalId,
    }: AuthGateway.SignUpParams): Promise<AuthGateway.SignUpResult> {
        const command = new SignUpCommand({
            ClientId: this.appConfig.auth.cognito.clientId,
            Username: email,
            Password: password,
            SecretHash: this.getSecretHash(email),
            UserAttributes: [{ Name: "custom:internalId", Value: internalId }],
        });

        const { UserSub: externalId } = await cognitoClient.send(command);

        if (!externalId) {
            throw new Error(`Cannot sign up user: ${email}`);
        }

        return {
            externalId,
        };
    }

    async refreshToken({
        refreshToken,
    }: AuthGateway.RefreshTokenParams): Promise<AuthGateway.RefreshTokenResult> {
        const command = new GetTokensFromRefreshTokenCommand({
            ClientId: this.appConfig.auth.cognito.clientId,
            RefreshToken: refreshToken,
            ClientSecret: this.appConfig.auth.cognito.clientSecret,
        });

        const { AuthenticationResult } = await cognitoClient.send(command);

        if (
            !AuthenticationResult?.AccessToken ||
            !AuthenticationResult?.RefreshToken
        ) {
            throw new Error("Cannot refresh token");
        }

        return {
            accessToken: AuthenticationResult.AccessToken,
            refreshToken: AuthenticationResult.RefreshToken,
        };
    }

    async confirmForgotPassword({
        confirmationCode,
        email,
        password,
    }: AuthGateway.ConfirmForgotPasswordParams): Promise<void> {
        const command = new ConfirmForgotPasswordCommand({
            ClientId: this.appConfig.auth.cognito.clientId,
            Username: email,
            ConfirmationCode: confirmationCode,
            Password: password,
            SecretHash: this.getSecretHash(email),
        });

        await cognitoClient.send(command);
    }

    async forgotPassword({
        email,
    }: AuthGateway.ForgotPasswordParams): Promise<void> {
        const command = new ForgotPasswordCommand({
            ClientId: this.appConfig.auth.cognito.clientId,
            Username: email,
            SecretHash: this.getSecretHash(email),
        });

        await cognitoClient.send(command);
    }

    private getSecretHash(email: string) {
        return createHmac("SHA256", this.appConfig.auth.cognito.clientSecret)
            .update(`${email}${this.appConfig.auth.cognito.clientId}`)
            .digest("base64");
    }
}

export namespace AuthGateway {
    export type SignUpParams = {
        email: string;
        password: string;
        internalId: string;
    };

    export type SignUpResult = { externalId: string };

    export type SignInParams = {
        email: string;
        password: string;
    };

    export type SignInResult = { accessToken: string; refreshToken: string };

    export type RefreshTokenParams = {
        refreshToken: string;
    };

    export type RefreshTokenResult = {
        accessToken: string;
        refreshToken: string;
    };

    export type ForgotPasswordParams = {
        email: string;
    };

    export type ConfirmForgotPasswordParams = {
        email: string;
        confirmationCode: string;
        password: string;
    };
}
