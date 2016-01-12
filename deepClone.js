//aStack, bStack为内部递归时调用，以应付遇obj1这种情况，
//var obj1={t1:"ying",};obj1["test1"]=obj1;
var deepClone = function(obj, aStack, bStack) {
	//不是对象，数组
	if (typeof obj !== 'object') return obj;

	//深度优先算法
	aStack = aStack || [];
	bStack = bStack || [];
	var length = aStack.length;
	while (length--) {
		if (aStack[length] === obj) return bStack[length];
	}

	var isArray = _.isArray(obj);
	var result = isArray ? [] : {};
	aStack.push(obj);
	bStack.push(result);
	if (isArray) {
		var length = obj.length;
		while (length--) {
			result[length] = deepClone(obj[length], aStack, bStack);
		}
    } else {
		var keys = _.keys(obj);
		for (var i = 0, len = keys.length; i < len; i++) {
			result[keys[i]] = deepClone(obj[keys[i]], aStack, bStack);
		}
    }

	aStack.pop();
	bStack.pop();
	return result;
}