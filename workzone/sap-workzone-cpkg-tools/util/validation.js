function isObject(o) {
	return typeof o === "object" && !Array.isArray(o);
}
function hasStringEntry(o, s, min = 1, start = "", end = "") {
	return o[s] && typeof o[s] === "string" && o[s].length >= min && o[s].startsWith(start) && o[s].endsWith(end);
}

module.exports.validation = {
	isObject: isObject,
	hasStringEntry: hasStringEntry
}