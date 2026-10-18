export const rules = {
    desc: /^\S(?:.*\S)?$/,
    amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
    date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
    duplicate: /\b(\w+)\s+\1\b/i
};

export function checkRecord(row, categories) {
    const raw = String(row.description ?? "");
    if (raw !== raw.trim()) return "Description can't begin and end with a space.";
    const description = raw.replace(/ {2,}/g, " ");
    const amount = String(row.amount ?? "").trim();
    const date = String(row.date ?? "").trim();
    const category = String(row.category ?? "").trim();
    
    if (!rules.desc.test(description)) return "Enter the description.";
    if (rules.duplicate.test(description)) return "Remove the repeated word (e.g coffee coffee).";
    if (!rules.amount.test(amount)) return "Amount must look like 12000 or 1200.50";
    if (!rules.date.test(date)) return "Date must be YYYY-MM-DD.";
    if (!rules.category.test(category)) return "Category uses letters, spaces, or hyphens.";
    if(categories && !categories.includes(category)) return "Choose a category from the list.";

return {description, amount: Number(amount), date, category };

}

