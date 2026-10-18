# Argenttracker
Student Finance Tracker for spending in RWF. Built with HTML, CSS, and JavaScript.
Contact: k.lyslet@alustudent.com
Github: https;//github.com/klysley-des

**Github pages:** add your pages URL here after you publish the site.

##Features
- About, dashboard, records, add/edit form, and settings.
- Each record has an id, description, amount, category,date, createdAt, and updatedAt.
- It Saves automatically in the browswer.
- Sort by date, description, and amount.
- Regex search with a acse option and a ahughlighted match
- Dashboard shows the record count, total, top category, last 7dats, and the spending cap
- Base currency RWF, plus USD and EUR rates typed in settings.
- Edit and and confirmed delete

## Regex Catalog
| Use | Pattern | Example |
| --- | --- | --- |
| Description | `/^\S(?:.*\S)?$/` | `Lunch` passes, ` Lunch` fails |
| Amount | `/^(0\|[1-9]\d*)(\.\d{1,2})?$/` | `12.50` passes, `012` fails |
| Date | `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | `2026-10-14` |
| Category | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | `Bus Pass` |
| Duplicate word | `/\b(\w+)\s+\1\b/i` | `coffee coffee` fails |
| Search: cents | `\.\d{2}` | finds `12.50` |
| Search: drinks | `coffee\|tea` | finds coffee or tea |

##Keyboard

- Tab and Shift+Tab move through the page
- Enter submit the form
- The first yab shows Skip to the actual content

## Accessbility

- The page uses header, nav, main, section, and footer
- Every input has a label
- The focus outlines is visible
- The cap message is polite under the cap and assertive when the cap is passed


##Run

1. Open this folder in visual Studio Code.
2. Right-click indesx.html and choose Open with Live Server
3. Click load Sample Data in Settings.
4. Open tests.html the same way. Every line should say PASS.

##Demo

This is my demo video link: 