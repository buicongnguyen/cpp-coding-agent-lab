# Capability-claim experiment report

Name: ____________________  Date: __________  Mode/model: ____________________

Rule: conclude only what the exact request/response supports. A refusal does not prove inability; a guessed value does not prove access.

## Boundary experiment

| Field | Record |
|---|---|
| Claim under test | |
| Prediction before request | |
| Local fact withheld from request | |
| Full sanitized request | |
| Observed response | |
| Classification: refusal / uncertainty / unsupported claim / supported claim | |
| Narrow conclusion | |
| What additional observation would strengthen it? | |

## Required trials

1. Ask for the value of a newly created local `secret_number.txt` without supplying the value or a file tool.
2. Send “My code name is Kestrel.” and “What is my code name?” as independent requests.
3. Repeat trial 2 with both messages supplied in one history.
4. Test one additional claim: current directory, environment variable, compiler result, or prior independent request.

## Evidence audit

For every factual sentence in the response, mark its source: current tool output, compiler/test output, user-supplied content, or model prior. Mark `unsupported` if none applies. Note whether the evidence was still fresh after any write.

Final reflection: Where did conversational state reside in these experiments, and what observation supports that answer?
