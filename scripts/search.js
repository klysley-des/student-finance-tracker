export function compile(input, ignoreCase) {
    const text = String(input || "").trim();
    if (!text) return { re: null, error: "" };

    let source = text;
    let flags = ignoreCase ? "i" : "";
    const wrapped = text.match(/^\/((?:\\.|[^\\/])+)\/([gimsuy]*)$/);
    if (wrapped) {
        source = wrapped[1];
        flags = wrapped[2] || flags;
    }
    if (ignoreCase && !flags.includes("i")) flags += "i";
    if (!flags.includes("g")) flags += "g";

    try {
        return { re: new RegExp(source, flags), error: "" };
    } catch {
        return { re: null, error: "That search pattern is not valid." };
    }
}

export function escapeHtml(value) {
    return String(value).replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch]));
}

export function highlight(value, re) {
    const text = String(value ?? "");
    if (!re) return escapeHtml(text);
    const finder = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
    let html = "";
    let index = 0;
    let match;
    while ((match = finder.exec(text))) {
        html += escapeHtml(text.slice(index, match.index));
        html += `<mark>${escapeHtml(match[0])}</mark>`;
        index = match.index + match[0].length;
        if (!match[0]) finder.lastIndex += 1;
    }
    return html + escapeHtml(text.slice(index));
}

export function matches(record, re) {
    if (!re) return true;
    const text = `${record.description} ${record.category} ${Number(record.amount).toFixed(2)} ${record.date}`;
    const flags = re.flags.includes("g") ? re.flags.replace("g", "") : re.flags;
    return new RegExp(re.source, flags).test(text);
}
    
