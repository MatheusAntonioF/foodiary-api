import type { CustomMessageTriggerEvent } from "aws-lambda";

import { render } from "@react-email/render";
import ForgotPassword from "@infra/emails/templates/ForgotPassword";

export async function handler(event: CustomMessageTriggerEvent) {
    if (event.triggerSource === "CustomMessage_ForgotPassword") {
        const confirmationCode = event.request.codeParameter;

        const html = await render(ForgotPassword({ confirmationCode }));

        event.response.emailSubject = "🍏 foodiary | Recupere a sua conta!";
        event.response.emailMessage = html;
    }

    return event;
}
