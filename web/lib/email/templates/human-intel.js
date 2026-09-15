import * as React from "react";
import { BaseEmail, Heading, Body, Button, InfoBox, Divider, MUTED_COLOR } from "./base";

export function HumanIntelAnsweredEmail({ displayName, question, response, platformUrl = "https://www.infinityvolume.com" }) {
  const preview = response?.slice(0, 120) + (response?.length > 120 ? "…" : "");
  return (
    <BaseEmail title="Your research question has been answered — InfinityVolume" previewText="Our research team has answered your question">
      <Heading>Research response ready</Heading>
      <Body>Hi {displayName}, our research team has completed their investigation and answered your question.</Body>
      <InfoBox label="Your question" value={question?.slice(0, 200) + (question?.length > 200 ? "…" : "")} />
      <Divider />
      <p style={{ margin: "0 0 8px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#555" }}>Research Response (preview)</p>
      <p style={{ margin: "0 0 20px", fontSize: 14, color: "#a0a0a0", lineHeight: 1.7, fontStyle: "italic" }}>{preview}</p>
      <Body>Read the full response on your Human Intel page.</Body>
      <Button href={`${platformUrl}/member/human-intel`}>Read full response →</Button>
      <Divider />
      <Body style={{ fontSize: 12, color: MUTED_COLOR }}>This response is for your research purposes only and does not constitute financial advice. Your answered questions are archived on your Human Intel page for future reference.</Body>
    </BaseEmail>
  );
}

export function HumanIntelFollowUpEmail({ displayName, question, followUpQuestion, platformUrl = "https://www.infinityvolume.com" }) {
  return (
    <BaseEmail title="Our research team needs more information — InfinityVolume" previewText="We have a follow-up question before we can answer your research request">
      <Heading>Follow-up needed</Heading>
      <Body>Hi {displayName}, our research team is reviewing your question and needs some additional details before they can provide a thorough response.</Body>
      <InfoBox label="Your original question" value={question?.slice(0, 200) + (question?.length > 200 ? "…" : "")} />
      <Divider />
      <p style={{ margin: "0 0 8px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#555" }}>Our follow-up question</p>
      <p style={{ margin: "0 0 24px", fontSize: 15, color: "#e8e6e0", lineHeight: 1.7 }}>{followUpQuestion}</p>
      <Body>Visit your Human Intel page to provide additional context. You can submit a new question with the follow-up information included in the context field.</Body>
      <Button href={`${platformUrl}/member/human-intel`}>Respond on Human Intel →</Button>
    </BaseEmail>
  );
}

export function HumanIntelDeniedEmail({ displayName, question, denialReason, platformUrl = "https://www.infinityvolume.com" }) {
  return (
    <BaseEmail title="Research request update — InfinityVolume" previewText="An update on your Human Intel research request">
      <Heading>Research request reviewed</Heading>
      <Body>Hi {displayName}, our research team has reviewed your request and unfortunately cannot fulfil it at this time.</Body>
      <InfoBox label="Your question" value={question?.slice(0, 200) + (question?.length > 200 ? "…" : "")} />
      <InfoBox label="Reason" value={denialReason} />
      <Divider />
      <Body>You are welcome to submit a new, revised question. Consider narrowing the scope or providing additional context to help our analysts provide a focused response.</Body>
      <Button href={`${platformUrl}/member/human-intel`}>Submit a new question →</Button>
    </BaseEmail>
  );
}
