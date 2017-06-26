/**
 * Prototype for a Process object, which manages a set of registers and an address space
 * and can interpret commands and run them.
 *
 * This implementation supports initializing a new process from a list of instructions.
 * There is no customization of the address space at process initialization -- the new
 * process simply gets a stack pointer and a text section, with the rest of memory
 * unmapped.
 */
var Process = function Process(text, $interval) {
	// Instance variables for helping with angular
	// probably can find a more elegant way to do this
	var stack; // return a reference to the same array each time
	var changed = true;
	var running;

	// Dictionary of labeled addresses in memory
	this.labels = {};
	this.labeled = {};
	this.STACK_INIT = 1000;
	this.WORD_SIZE = 4;

	/**
	 * Set up a process by reading the text section and initializing
	 * the labels dictionary and memory space accordingly.
	 */
	this.setup = function(text) {
		// Virtual Address Space with 4-byte word size
		this.mem = new Memory(this.WORD_SIZE);

		// Text section, held separately from process memory
		// (cannot edit program during execution)
		this.text = [];
		var addr = 0;
		for (var i = 0; i < text.length; i++) {
			var tokens = text[i].split(' ');

			if (tokens[0].indexOf(':') !== -1) {
				var l = tokens.shift().slice(0, -1);
				this.labels[l] = addr;
				this.labeled[addr.toString()] = l;
			}

			if (tokens.length > 0) {
				this.text.push(tokens);
				addr++;
			}
		}
	}

	/**
	 * Set the values to their default values at process start.
	 * Can be called on a running process to start it over.
	 */
	this.start = function() {
		changed = true;
		// Get a blank set of Virtual Registers
		this.regs = new Registers();

		// Set the program counter to zero
		this.regs.set('rip', 0);

		// Arbitrarily set the stack pointer to STACK_INIT
		this.regs.set('rsp', this.STACK_INIT);

		// Number of instructions executed
		this.instsExecuted = 0;
	};

	this.setup(text);
	this.start();

	/**
	 * Execute the next instruction in the program.
	 * That is, fetch the next instruction referenced by the
	 * instruction pointer, intepret it, and update the state of
	 * the virtual machine to reflect the instruction's execution.
	 */
	this.step = function() {
		// Get next instruction to execute
		var addr = this.regs.get('rip');

		// Validate instruction address, do nothing at end of program
		if (addr > this.text.length)
			return false;

		// Increment instruction pointer and fetch instruction
		this.regs.set('rip', addr + 1);
		var inst = this.text[addr];

		// Evaluate instrunction
		console.log('Executing: ' + inst);
		this.evaluate(inst);
		this.instsExecuted++;

		changed = true;
		return true;
	};

	/**
	 * The interpreter is implemented here.  Take an instrunction and
	 * operands as a string, parse it, and produce its effect on the simulated process.
	 */
	this.evaluate = function(tokens) {
		// Separate instrunction into tokens
		// var tokens = inst.split(' ');

		switch (tokens[0]) {
			case 'mov':
				// memory access
				var src = this.access(tokens[1]);
				console.log('MOVE: first token evaluated to ' + src);
				this.update(tokens[2], src);
				break;

			case 'add':
				// addtion, dest += src
				var src = this.access(tokens[1]);
				var dest = this.access(tokens[2]);
				this.update(tokens[2], src + dest);
				break;

			case 'sub':
				// subtraction, dest -= src
				var src = this.access(tokens[1]);
				var dest = this.access(tokens[2]);
				this.update(tokens[2], src - dest);
				break;

			case 'jmp':
				// jump to address specified by label
				var addr = this.find(tokens[1]);
				this.regs.set('rip', addr);
				break;

			case 'push':
				// subtract off stack
				var stack = this.regs.get('rsp');
				this.regs.set('rsp', stack - this.WORD_SIZE);
				// put value on top
				var src = this.access(tokens[1]);
				this.update('(%rsp)', src);
				break;

			case 'pop':
				// get top of stack
				var src = this.access('(%rsp)');
				this.update(tokens[1], src);
				// update stack pointer
				var stack = this.regs.get('rsp');
				this.regs.set('rsp', stack + this.WORD_SIZE)
				break;

			case 'call':
				// push current address onto stack
				var stack = this.regs.get('rsp');
				this.regs.set('rsp', stack - this.WORD_SIZE);
				this.update('(%rsp)', this.regs.get('rip'))
				// jump to label
				var addr = this.find(tokens[1]);
				this.regs.set('rip', addr);
				break;

			case 'ret':
				// pop from stack to instruction pointer
				var addr = this.access('(%rsp)');
				this.regs.set('rip', addr);
				var stack = this.regs.get('rsp');
				this.regs.set('rsp', stack + this.WORD_SIZE)
				break;
		}
	};

	/**
	 * Resolve an operand into a literal, memory address, or register,
	 * and return its value as an integer.
	 */
	this.access = function(op) {
		// Literal operand
		if (op.startsWith('$')) {
			console.log('ACCESS: literal operand');
			return parseInt(op.slice(1));
		}

		// Memory operand
		var idx = op.indexOf('(');
		if (idx !== -1) {
			console.log('ACCESS: offset operand');
			// parse memory access
			var offset = parseInt(op.slice(0, idx)) || 0;
			// get register value
			var reg = this.regs.get(op.slice(idx+2, -1));
			console.log('ACCESS: offset = ' + offset + '; reg = ' + reg);
			return this.mem.get(offset + reg);
		}

		// Register operand
		console.log('ACCESS: register operands');
		return this.regs.get(op.slice(1));
	};

	/**
	 * Resolve an operand as a memory address or register and
	 * set its value to val.
	 */
	this.update = function(op, val) {
		if (op.startsWith('$')) {
			throw new SyntaxError('Cannot set value of immediate operand: ' + op);
		}

		// Memory operand
		var idx = op.indexOf('(');
		if (idx !== -1) {
			// parse memory access
			var offset = parseInt(op.slice(0, idx)) || 0;
			// get register value
			console.log('register ' + op.slice(idx+2, -1));
			var reg = this.regs.get(op.slice(idx+2, -1));

			console.log('\tsetting memory at addr ' + offset + reg);

			return this.mem.set(offset + reg, val);
		}

		// Register operand
		return this.regs.set(op.slice(1), val);
	};

	/**
	 * Resolve a label/address into an address
	 * @param {string} label -- the name of the label to jump to
	 */
	this.find = function(label) {
		if (isNaN(label)) {
			return this.labels[label];
		} else {
			return parseInt(label);
		}
	}

	/**
	 * Continuously step at interval provided
	 */
	this.run = function(interval) {
		running = $interval(
			this.step.bind(this),
			interval
		);
	}

	/**
	 * Pause a running program
	 */
	this.pause = function() {
		$interval.cancel(running);
	}

	/**
	 * Return each item on the stack
	 */
	 this.stackItems = function() {
	 	if (!changed) return stack;
	 	stack = [];
	 	for (var addr = this.STACK_INIT - this.WORD_SIZE;
	 		addr >= this.regs.get('rsp');
	 		addr -= this.WORD_SIZE) {
	 		// grab from stack and append to list
	 		stack.push({
	 			'addr' 	: addr.toString(),
	 			'val' 	: this.mem.get(addr)
	 		});
	 	}

	 	changed = false;
	 	return stack;
	 }

	 /**
	  * Return the current instruction address
	  */
	 this.where = function() {
	 	return this.regs.get('rip');
	 }

	 /**
	  * Return the label of a given address or the empty
	  * string if the address is unlabeled
	  */

	 this.labelFor = function(addr) {
 		var l = this.labeled[addr.toString()];
 		if (l !== undefined) {
 			return l + ':';
 		} else return '';
	 }
}

/**
 * @constructor for a set of registers
 */
function Registers() {
	// Values are fixed for now, initialize all to zero
	// This implementation uses anything as a register value -- inaccurate, but good for now
	// Registers have a single size, no way of accessing individual bits of a register
	this.regs = {
		'r0'	: 0,
		'r1'	: 0,
		'r2'	: 0,
		'r3'	: 0,
		'r4'	: 0,
		'r5'	: 0,
		'rip'	: 0,
		'rsp'	: 0
	};

	/* Set the value of register reg to val */
	this.set = function(reg, val) {
		// Validate value and register
		// TODO

		// Update value
		this.regs[reg] = val;
	};

	/* Return the value stored in register reg */
	this.get = function(reg) {
		// Valuidate register name
		// TODO

		// Return value
		return this.regs[reg];
	};

	/* Return the state of the registers as a simple javascript object */
	this.context = function() {
		return this.regs;
	}
}

/**
 * Prototype for a memory object, which will represent a Process's address space.
 */
function Memory(wordSize) {
	this.UNMAPPED_VAL = 0;

	// The number of bytes for a single word on the system
	this.wordSize = wordSize;
	// Total number of addresses available
	//this.capacity = 2^(8 * wordSize);

	// What parts of memory have been mapped ?
	this.contents = {};

	/**
	 * Return the value in the memory space stored at address addr
	 */
	this.get = function(addr) {
		addr = addr.toString();
		// Return value at address or default value
		if (this.contents[addr] != null) {
			return this.contents[addr];
		} else if (addr >= 0) {// && addr < this.capacity) {
			// Warn that an unmapped address has been accessed
			console.log('Accessed unmapped memory address ' + addr);
			console.log('Capacity is ' + this.capacity);
			console.log('\n Returning default value ' + this.UNMAPPED_VAL);

			// Return default value for unmapped memory
			return this.UNMAPPED_VAL;
		} else {
			// Warn that a nonexistant address has been accessed
			console.log('Bad memory access.  Attempted to read from address ' + addr);
			console.log('Capacity is ' + this.capacity);
			console.log('Returning null');

			return null;
		}
	};

	/**
	 * Store the value val in the memory space at address addr
	 */
	this.set = function(addr, val) {
		// Validate addr
		addr = addr.toString();
		if (addr < 0) {//|| addr >= this.capacity
			// Error, warn but do nothing
			console.log('Bad memory access.  Attempted to write to address ' + addr);
		} else {
			// Set value of specified address
			this.contents[addr] = val;
		}

		return addr;
	}
}
