# React Autocomplete Component

A customizable and accessible autocomplete input component built with React, TypeScript, and @floating-ui/react. Supports both single and multiple selection modes, optional loading state, filtered options, and fully customizable rendering for each option.

## Controls
- Clicking on the component opens up the options window and focuses on the search input.
- Clicking on an option will (de)select the option.
- When the options window is open, clicking outside the component will cause the window to close and unfocus the search input
- Options can be iterated through via Up and Down Arrow Keys, and should be  “loop around” at the start and end.
- Option can be (de)selected via the Enter Key.
- The options window can be closed via the Escape Key.

## Component Usage
- Synchronous autocomplete with single and multiple option(s) selection.
- Debounced search, i.e. filtering of displayed options only occurs after typing has 
ceased for a specified amount of time

## How to use the component
1. Install component as dependency: npm install github:soumyadip-cmd/beep-technical-assessment
1. Assuming file is located at src/components/Autocomplete.tsx, include the following in your imports:
```typescript
import Autocomplete from 'your-repo-name/src/components/Autocomplete';
```
