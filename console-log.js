
/**
 * Console.log with timestamp
 * */
var log = console.log;
console.log = function () {
	var first_parameter = arguments[0];
	var other_parameters = Array.prototype.slice.call(arguments, 1);

	log.apply(console, [new Date().toLocaleString()+": " + first_parameter].concat(other_parameters));
};

/**
 * Console.error with timestamp
 * */
var loge = console.error;
console.error = function () {
	var first_parameter = arguments[0];
	var other_parameters = Array.prototype.slice.call(arguments, 1);

	loge.apply(console, [new Date().toLocaleString()+" [ERROR]: " + first_parameter].concat(other_parameters));
};
