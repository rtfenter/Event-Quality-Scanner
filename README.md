# Event Quality Scanner  
[![Live Demo](https://img.shields.io/badge/Live%20Demo-000?style=for-the-badge)](https://rtfenter.github.io/Event-Quality-Scanner/)

### A small interactive tool that validates whether an event meets quality, naming, and domain rules.

This project is part of my **Systems of Trust Series**, exploring how distributed systems maintain truth, alignment, and consistency across event flows and microservices.

The goal of this scanner is to provide a simple, legible way to check whether a JSON event follows expected governance rules — before drift or inconsistencies show up downstream.

---

## Purpose

Event quality issues create silent failures in distributed systems.  
Even small discrepancies — wrong types, missing fields, naming mismatches — can cause:

- incorrect processing in downstream services  
- broken dashboards  
- inconsistent analytics  
- confused debugging  
- increased drift in event meaning over time  

This scanner surfaces these issues clearly and early.

---

## Features (MVP)

This prototype includes:

- Input box for a single JSON event  
- Required-field verification  
- Type validation for configured fields  
- Naming checks (snake_case, camelCase, etc.)  
- Domain rule validation (e.g., allowed values)  
- Summary of pass/fail  
- Human-readable list of issues  

This tool is intentionally minimal and aimed at conceptual clarity.

---

## Demo Screenshot
<img width="2696" height="1552" alt="Screenshot 2025-11-23 at 08-22-11 Event Quality Scanner" src="https://github.com/user-attachments/assets/7a190b85-9fef-410e-b12e-dac7feaea6a4" />

---

## Quality Check Flow Diagram

```
         [Input JSON Event]
                  |
                  v
      Required Field Validator
      (presence + emptiness)
                  |
                  v
        Type & Format Validator
      ("123" vs 123, enum checks)
                  |
                  v
       Naming Convention Checker
      (snake_case vs camelCase)
                  |
                  v
        Domain Rule Validation
      (allowed values, patterns)
                  |
                  v
          Quality Summary
 (issues found, pass/fail status)
```

---

## Why Event Quality Matters

Even small inconsistencies ripple through distributed systems:

- mismatched schemas between services  
- harder reconciliation and joining  
- incorrect metrics and dashboards  
- misaligned contract assumptions  
- unclear meaning during incidents  
- ML models learning inconsistent patterns  

This tool makes the earliest layer of trust legible: whether an event is even valid on its own.

---

## How This Maps to Real Systems

Each component corresponds to a real architectural concern:

### Required Fields  
Missing fields often break pipelines or create ambiguous meaning.

### Type Consistency  
A number stored as a string can break aggregations, joins, or filters.

### Naming Conventions  
Teams evolving independently create schema forks (user_id, userId, userid).

### Domain Rules  
Certain fields must follow controlled vocabularies (e.g., “LOGIN”, “PURCHASE”).

### Summary  
A quick pass/fail gives teams clarity on whether the event meets its contract.

This scanner models a small but critical slice of event validation.

---

## Part of the Systems of Trust Series

Main repo:  
https://github.com/rtfenter/Systems-of-Trust-Series

---

## Status

MVP implemented and active.  
This scanner will focus on core mechanics required to demonstrate event quality checks, not full production validation.

---
## Local Use

Everything runs client-side.

To run locally:

1. Clone the repo  
2. Open `index.html` in your browser  

That’s it — static HTML + JS, no backend required.
