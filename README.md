# Processable
A Javascript process emulator and visual inspector/debugger.

## Timeline:
* November
  - Interpreter:
    - [x] Registers
    - [x] byte-addressable Memory
    - [x] read-only text section
    - [x] operand parsing/execution of most popular instructions
  - View:
    - [x] Set up node environment for React, build system with webpack 
    - [x] Component for viewing text section
    - [x] Component for viewing Registers and toggling decoding
* December
  - Interpreter:
    - [ ] Add support for flags, conditional instructions
    - [x] Compose "assembler" module and support .data, .bss, and .rodata sections
    - [ ] Write tests for remaining mnemonics
  - View:
    - [x] Implement component for viewing the stack 
      - [ ] with toggle-able decoding options
    - [x] Add flags to view
    - [x] Add breakpoint toggles and execution controls to view
* January
  - Interpreter:
    - [ ] Support external function calls for c standard library methods
    - [ ] Connect with compiler on server side to run compiled C code
    - [ ] Add support for the heap / brk()
  - View:
    - [ ] Host alpha version and begin to solicit feedback
    - [ ] Improve customizability of stack/text components
    - [ ] Design Heap component
  - Paper:
    - [ ] Begin writing research/related projects
    - [ ] Describe core functionality and implementation
* February
  - Interpreter:
    - [ ] Investigate substituting different architectures, restructuring if necessary
    - [ ] (stretch) Create alternate version to support ARM assembly
  - View:
    - [ ] Iterate on visual design from early feedback
    - [ ] (stretch) Integrate DWARF information from compiled code (toggle between source and assembly)
    - [ ] (stretch) Tweak view for flexibility in subsituting architectures
  - Paper:
    - [ ] Evaluate investigation into multiple architecture support, conclude on viability / potential for future work
* March
  - Interpreter:
    - [ ] Ensure very robust error handling
    - [ ] Test on large array of programs to uncover weaknesses, document and/or fix them
    - [ ] Conclude all substantive edits to assembly interpreter / vm
  - View:
    - [ ] Integrate feedback from early users, host and solicit feedback on first iteration
    - [ ] Perform walkthroughs with students and collect detailed experience reports
    - [ ] Add inline documentation where applicable, and compose separate about section
* April
  - View:
    - [ ] Integrate feedback on first iteration, release documented beta version
  - Paper:
    - [ ] Document student expriences
    - [ ] Finish describing implementation details
    - [ ] Seek feedback on documentation from professors
    - [ ] Clearly delineate between promising and unpromising areas of future work 

## What it is
This project has a similar motivation to [Assemblance](http://github.com/rmw2/Assemblance): to demystify the working of computers on the operating system, process, and instruction levels.  Where assemblance focuses on relating instructions generated by a compiler to their corresponding source, this project aims to visualizes the state of the machine as a process executes, again relating higher-level programming concepts to their system-level implementation.

We would like in particular to visualize registers and the stack throughout program execution, updating an HTML markup of the system after the execution of each instruction.  As a way to teach systems programming, instructors are often tasked with conducting elaborate program traces to convey what's happening "beneath the hood" to their students.  Performing these traces by hand on a blackboard is exhausting, and becomes messier as addresses change contents and must be erased and written over.  However, generating these one instruction at a time in a program like Powerpoint is still more tedious.  We propose a browser application that can generate these traces automatically for an arbitrary program.  Eventually we would also like to develop a way to represent memory sections as they exist in a linux process: including .text, .rodata, .data, .bss, the memory mapping section, and the heap.

## What it isn't
While "visual debugging" is a phrase that describes more or less the interface, it does not aim to be the go-to debugger for someone working on a large project, as performance is not a primary concern, or even identical behavior to a particular machine.  Instead, we wish to help _understand_ the way programs are executed at the border between hardware and software. 

This work is part of my senior thesis, advised by [Bob Dondero](https://www.cs.princeton.edu/~rdondero/about.html), and will be under development from June 2017 until (at least) April 2018.
