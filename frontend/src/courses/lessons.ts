export interface Lesson {
  id: string;
  title: string;
  paragraphs: string[];
  example: string;
  exercise: string;
  checks: string[];
}

/** Kept out of the entry bundle; full lessons load with the public course pages. */
export const COURSE_LESSONS: Record<string, Lesson[]> = {
  'prompting-fundamentals': [
    {
      id: 'write-a-clear-brief',
      title: 'Write a clear brief',
      paragraphs: [
        'A useful prompt tells the model what to do, what information to use and what the result should look like. Start with an action such as compare, explain or draft. Then name the audience and include the facts the answer must preserve.',
        'Use Prompt for an open-ended task. Keep instructions separate from source material so a quoted email or document is clearly something to work on. When information is missing, ask the model to identify the gap instead of filling it with a plausible detail.',
      ],
      example: 'Task: Draft a project update for our design team.\nFacts: The prototype is ready. Testing starts on 12 October. Maya owns recruitment. The release date is not decided.\nFormat: Three bullets: progress, next step, open question.\nConstraints: Use only these facts. Do not invent a release date.',
      exercise: 'Write an update using the example. Change the audience to a client and rerun it. Compare which words changed and which facts stayed the same.',
      checks: ['The response contains exactly three bullets.', 'Maya and 12 October are preserved.', 'The undecided release date stays undecided.'],
    },
    {
      id: 'choose-your-context',
      title: 'Choose your context',
      paragraphs: [
        'A follow-up works best when it carries the specific information it needs. In Nevatal, Reply targets an exchange and Remember selects messages to include in later requests. Use Memory & history to review what you have selected before starting an unrelated task.',
        'Remember a stable preference, such as the intended audience, when it applies to the next request. Avoid remembering an entire conversation just because it exists: old facts can conflict with a new brief. If an answer goes off track, inspect the selected context and restate the current task.',
      ],
      example: 'Useful context: Our readers are new project managers. Explain unfamiliar terms.\nNew task: Explain the difference between a milestone and a task in two sentences, followed by one example.',
      exercise: 'Send the audience preference in Prompt and mark it Remember. Ask the new question, then forget that preference and ask for a version for experienced project managers.',
      checks: ['The remembered preference is visible in Memory & history.', 'The explanation fits the intended reader.', 'Unrelated facts from the project update do not appear.'],
    },
    {
      id: 'check-the-answer',
      title: 'Check the answer',
      paragraphs: [
        'A fluent answer can still contain a mistake. Use Explainer to unpack an unfamiliar idea, then compare the explanation with your source material. Asking the same model whether it is correct is not independent verification.',
        'Before using a result, check names, dates, calculations and claims against something you can inspect. If the brief only supports a limited answer, a useful response should say what is unknown. Save a version of the prompt that worked so you can reuse its structure.',
      ],
      example: 'Explain this statement to a beginner: “The team completed 8 of its 10 planned tasks.”\nDistinguish what this tells us about task count from what it does not tell us about effort or project completion.',
      exercise: 'Ask Explainer to explain the statement. Calculate the completed share yourself and identify one conclusion the numbers do not support.',
      checks: ['Eight of ten tasks is 80% by count.', 'Task count is not treated as a measure of hours worked.', 'The response does not claim the whole project is 80% complete.'],
    },
  ],
  'writing-and-editing': [
    {
      id: 'brief-the-draft',
      title: 'Brief the draft',
      paragraphs: [
        'Before opening Writer, decide who will read the piece and what they should understand or do afterward. Put the subject in “What should we write about?”, choose the content type and length, and use Audience and Key points to include for the details that matter.',
        'A first draft is easier to review when its claims come from a short set of facts. Include the facts you have, explain which details are undecided and leave out statistics you cannot support. Read the outline and opening before spending time polishing sentences.',
      ],
      example: 'Topic: Announce a weekly office hour for new volunteers.\nAudience: People joining the community garden.\nKey points: Saturdays, 09:00–10:00; meet at the tool shed; bring water; no experience needed.\nGoal: Help a newcomer know when to arrive and what to bring.',
      exercise: 'Use Writer to produce a short announcement from this brief. Check whether a new volunteer can act on it without asking for the basic details.',
      checks: ['The time and meeting place match the brief.', 'The draft says no experience is needed.', 'It does not invent an address, contact or registration link.'],
    },
    {
      id: 'revise-then-proofread',
      title: 'Revise, then proofread',
      paragraphs: [
        'Use Rewriter when the wording, tone or structure needs to change. Choose one rewrite goal at a time so you can judge its effect. Compare the result with the original instead of assuming that a smoother sentence means the same thing.',
        'Once the structure is settled, use Proofreader for spelling, punctuation and grammar. Keep the source draft beside the result and watch for changes to commitments: “may”, “will” and “must” are not interchangeable.',
      ],
      example: 'We may extend the pilot after the review. Please sends your feedback by Thursday. The current pilot ends on Friday; a longer rollout has not been approved.',
      exercise: 'Rewrite the example for clarity, then proofread it. Identify the grammar correction separately from any changes in tone or meaning.',
      checks: ['“Please sends” becomes “Please send”.', 'An extension remains a possibility, not a promise.', 'Thursday and Friday keep their original roles.'],
    },
    {
      id: 'summarize-for-a-decision',
      title: 'Summarize for a decision',
      paragraphs: [
        'A summary should serve a reader. In Summarizer, choose the length and format, then use “Focus on” to name the information that matters: decisions, action items, risks or unanswered questions.',
        'Check a summary against the original for omissions as well as invented details. A short version can be factually accurate sentence by sentence and still mislead if it drops an important condition. Keep the source available for anyone who needs the full context.',
      ],
      example: 'The team agreed to test the new booking form with five volunteers. Noor will recruit them by Tuesday. Testing is planned for Thursday if recruitment is complete. The team has not decided whether to replace the existing form.',
      exercise: 'Ask Summarizer for bullet points focused on decisions and action items. Compare the result with the source and underline the condition attached to Thursday.',
      checks: ['Noor is the recruitment owner and Tuesday is the deadline.', 'Thursday testing depends on recruitment being complete.', 'Replacing the existing form remains undecided.'],
    },
  ],
  'business-content': [
    {
      id: 'start-with-a-real-offer',
      title: 'Start with a real offer',
      paragraphs: [
        'Give Idea Generator a specific audience, goal and constraint. Ask for distinct approaches, then choose one based on what your audience needs and what you can actually deliver. A long list of ideas is only useful if you have a way to compare them.',
        'Carry the same brief into Copywriting. State the channel and the facts you can support. Review every benefit, number and promise; a persuasive phrase is not evidence that a product has that feature.',
      ],
      example: 'Offer: A free 30-minute introduction to bicycle maintenance at a neighborhood workshop.\nAudience: Adults who commute by bike.\nFacts: Demonstration covers tire pressure and chain care. Participants bring their own bikes.\nGoal: Explain why a beginner might attend.\nConstraint: Do not promise repairs or invent testimonials.',
      exercise: 'Generate three campaign angles, choose the clearest one and draft a short piece of copy. Explain why that angle fits a commuting beginner.',
      checks: ['The offer is described as an introduction.', 'No repairs, results or testimonials are invented.', 'The audience can tell what the session covers.'],
    },
    {
      id: 'write-an-actionable-email',
      title: 'Write an actionable email',
      paragraphs: [
        'In Email Builder, use the background field for context and “What should the email say?” for the message and requested action. Fill in To and From, then choose a tone and length that fit the relationship.',
        'Put one main request in the email and give a deadline only if you have one. Review the subject and first paragraph together: the reader should understand why the message arrived and what to do next without searching through a long introduction.',
      ],
      example: 'Background: Three workshop volunteers offered to help with the bicycle demonstration.\nTo: The volunteer team.\nFrom: Sam, workshop coordinator.\nMessage: Ask each person to confirm by Wednesday whether they can demonstrate tire pressure or chain care. Do not assign roles before they reply.',
      exercise: 'Draft a concise email from the example. Check that the request can be answered in one reply and that the draft does not invent a session date.',
      checks: ['The email asks for availability and a preferred demonstration.', 'Wednesday is the reply deadline.', 'No volunteer is presented as having already accepted a role.'],
    },
    {
      id: 'adapt-for-a-channel',
      title: 'Adapt for a channel',
      paragraphs: [
        'Social Caption lets you set the platform, audience, tone and length. Use the same factual brief when comparing versions so that the change in channel does not quietly become a change in the offer.',
        'Choose hashtags, emojis and a call to action only when they help the message. Read the final caption in its destination before posting, and add a real booking link or date yourself if the brief did not contain one.',
      ],
      example: 'Write a caption about the bicycle maintenance introduction. Emphasize learning tire pressure and chain care. The audience is people who ride to work. Invite them to ask the workshop for the next session details. Do not invent a booking URL or date.',
      exercise: 'Create one LinkedIn caption and one Instagram caption from the same brief. Compare the openings and calls to action, then choose which best fits your audience.',
      checks: ['Both captions describe the same offer.', 'The next action is clear and possible.', 'Dates, URLs and urgency claims are not fabricated.'],
    },
  ],
  'translation-and-feedback': [
    {
      id: 'set-the-register',
      title: 'Set the register',
      paragraphs: [
        'In Translator, choose the source and target languages and a register appropriate for the reader. A support reply, a formal announcement and a message to a friend can convey the same information with different wording.',
        'Start with a short passage whose meaning you understand. Keep product names, reference numbers and dates easy to identify. When a phrase has several possible meanings, add enough context to the source text to make the intended meaning clear.',
      ],
      example: 'Hello Rina, your workshop booking AB-204 is confirmed for 14 October at 10:00. Please arrive ten minutes early. If you need to change the booking, reply to this message.',
      exercise: 'Translate the example from English to Indonesian using a formal register, then try a casual register. Compare the tone while checking the same factual details.',
      checks: ['Rina and AB-204 remain unchanged.', 'The date, time and ten-minute arrival instruction are preserved.', 'The formal version remains polite without adding promises.'],
    },
    {
      id: 'review-the-translation',
      title: 'Review the translation',
      paragraphs: [
        'Review a translation for meaning, not just grammatical appearance. Compare numbers, negation, conditions and who is responsible for each action. These are details that can change the practical meaning of a message.',
        'Translating the output back to the original language can expose a mismatch, but it is not proof of accuracy: the same ambiguity can survive both steps. For a message you cannot assess yourself, have someone who understands the target language review it before use.',
      ],
      example: 'The replacement is available only if the original item is returned. Delivery is not included. Please keep the original reference number ZX-18.',
      exercise: 'Translate the example and make a three-item checklist for a reviewer. Focus on the condition, the excluded service and the reference number.',
      checks: ['Replacement still depends on returning the original.', 'Delivery remains excluded.', 'ZX-18 is copied exactly.'],
    },
    {
      id: 'read-mixed-feedback',
      title: 'Read mixed feedback',
      paragraphs: [
        'Sentiment Analysis can help organize feedback, but a single label can hide a useful distinction. A reviewer may like the product and dislike delivery. Read the explanation and the original wording before deciding what action to take.',
        'Keep the unit of analysis consistent. If you compare separate reviews, preserve their boundaries instead of joining them into one voice. Treat ambiguous or sarcastic text as something to inspect, and avoid assuming that a label measures the strength or frequency of a problem.',
      ],
      example: 'The lamp looks great and was easy to assemble, but it arrived three days late. Support answered quickly, although they could not give me a delivery update.',
      exercise: 'Analyze the example in Sentiment Analysis. Separate the product, delivery and support comments, then write one action grounded in the review.',
      checks: ['Appearance and assembly are recognized as positive.', 'The delivery delay and missing update remain visible.', 'One review is not treated as evidence of a trend across all customers.'],
    },
  ],
  'documents-and-images': [
    {
      id: 'ask-from-a-document',
      title: 'Ask from a document',
      paragraphs: [
        'Document AI uses an uploaded PDF as a source for questions. In Nevatal, this tool requires a Google Gemini API key. Use a small PDF you can inspect while you learn the workflow, such as a fictional workshop brief.',
        'Upload the PDF and check the document list before asking a focused question. Document AI searches across every indexed document listed above the chat, so name your practice file in the question if you have other documents. If the sources do not contain the answer, ask the model to say so rather than fill the gap from general knowledge.',
      ],
      example: 'Create a one-page PDF containing these practice facts:\nThe workshop has 12 places. Registration closes on 8 October. Lee manages the waiting list. No venue has been selected.\n\nQuestion: Who manages the waiting list, and what is the registration deadline? Use only this document.',
      exercise: 'Save the practice facts as workshop-practice.pdf, upload it, and ask the question with the filename included. Open the original PDF beside the answer and find the sentences that support it.',
      checks: ['The answer identifies Lee and 8 October.', 'You can locate both facts in the original PDF.', 'The response does not mix in facts from unrelated indexed documents.'],
    },
    {
      id: 'find-the-limits',
      title: 'Find the limits of an answer',
      paragraphs: [
        'Document search retrieves relevant passages; it does not guarantee that every answer fully represents the document. Ask about one topic at a time and check important details directly in the PDF. If text in a scanned or complex page cannot be read reliably, do not treat a confident answer as evidence that it was extracted correctly.',
        'Try a question whose answer is absent. This is a useful check of whether your instructions are being followed. Keep documents organized and remove a practice upload from Document AI when you no longer need its saved index.',
      ],
      example: 'What is the workshop venue? If the document does not specify a venue, say that it has not been selected. Do not suggest a location.',
      exercise: 'Ask the venue question about your practice PDF, then ask for the number of places. Compare the unsupported question with the one the document can answer.',
      checks: ['The response does not invent a venue.', 'The supported answer says 12 places.', 'You verify the source rather than relying only on a quoted passage in the answer.'],
    },
    {
      id: 'write-an-image-brief',
      title: 'Write an image brief',
      paragraphs: [
        'Image Generation also requires a Google Gemini key. Describe the subject, setting, composition and lighting in the prompt, then choose the Style and Framing controls. Mention space for a headline if the image will be used in a layout.',
        'Review the result against the brief and change one part of the prompt at a time. Look closely at details such as hands, objects and lettering. Add exact text in a design tool when the generated image does not reproduce it reliably.',
      ],
      example: 'A blue commuter bicycle leaning against a pale brick wall beside a small potted plant. Soft morning light, simple background. Place the bicycle in the right half and leave clear space on the left for a headline. No text or logos.',
      exercise: 'Generate the image, then make a second version that changes only the lighting to an overcast afternoon. Compare composition and object details as well as mood.',
      checks: ['The bicycle is on the right with usable space on the left.', 'The image has no unwanted lettering or logos.', 'The two briefs differ only in the lighting instruction.'],
    },
  ],
  'data-and-batch-workflows': [
    {
      id: 'define-the-output-schema',
      title: 'Define the output schema',
      paragraphs: [
        'Data Formatter separates “Validate only” from “Clean and convert”. Validate when you want a report about the input; convert when you want a rewritten result. Choose a target format and state the field names, types and missing-value rules in Extra instructions.',
        'Keep a copy of the original records. Cleaning should not silently turn an unknown number into zero or drop a row because it is incomplete. Check the resulting structure in the system that will consume it before using it in a larger workflow.',
      ],
      example: 'Input:\nname,quantity\nNotebook,3\nPencil,\n\nTarget: JSON\nExtra instructions: Return an array of objects with name (string) and quantity (number or null). Use null for a missing quantity. Preserve both records.',
      exercise: 'Convert the input to JSON and compare every field with the original. Then run Validate only on the source to see how the missing quantity is reported.',
      checks: ['There are two records in the output.', 'Notebook has the number 3, not a quoted string.', 'Pencil has null, not an invented zero.'],
    },
    {
      id: 'check-a-small-analysis',
      title: 'Check a small analysis',
      paragraphs: [
        'In Data Analysis, upload a CSV or paste rows with a header. Add a question that names the measure you want to compare. Read the row count, column profile and missing values before interpreting a chart.',
        'Nevatal computes chart values from the uploaded data, while the model proposes insights from a profile and sample. Check the narrative against the numbers: an observed difference does not by itself explain why it happened, and a missing value can change which rows support a comparison.',
      ],
      example: 'day,orders,revenue\nMonday,2,40\nTuesday,3,75\nWednesday,1,15\n\nQuestion: Compare revenue by day and report total revenue. Do not infer the reason for any difference.',
      exercise: 'Analyze the sample and calculate the total yourself. Check which day has the highest revenue and whether the response invents a cause.',
      checks: ['The file contains three data rows.', 'Total revenue is 130 and Tuesday has the highest revenue at 75.', 'No claim about advertising, demand or seasonality is invented.'],
    },
    {
      id: 'test-before-batching',
      title: 'Test before batching',
      paragraphs: [
        'Batch Runner applies one selected tool to multiple inputs. Test a few representative items first and inspect the output shape before scaling up. Each item makes a provider request, so choose the size of the run deliberately.',
        'Choose “One item per line” for short standalone inputs, or “Blank line between items” for paragraphs that contain line breaks. Review the item list before running it. Afterward, inspect failed items and download the results; a completed request still needs a content check.',
      ],
      example: 'Three proofreading inputs, one per line:\nThe notebooks is ready.\nPlease send the draft by Friday.\nWe may extend the review if the team agrees.',
      exercise: 'Select Proofread, load the three lines and run a small batch. Compare the corrected sentence, the already correct sentence and the conditional statement before trying more inputs.',
      checks: ['The preview contains three separate items.', '“The notebooks is ready” is corrected without changing the subject.', 'The conditional extension remains conditional in the downloaded result.'],
    },
  ],
};
