+++
date = '2026-02-17T09:56:03+01:00'
title = 'The Wolfram Engine'
subtitle = 'Implementing the Wolfram Language everywhere'
categories = ['symbolic', 'containers', 'wolfram']
summary = ' '
+++

# What Wolfram provides

Wolfram released its [engine](https://www.wolfram.com/engine-technology/) (that is available [for download](https://www.wolfram.com/engine/)). In particular, we collect the following references that have been useful to our work:
- [WSTP (Wolfram Symbolic Transfer Protocol)](https://www.wolfram.com/wstp/): long a core enabling component of Wolfram systems, is the native protocol for transferring Wolfram Language symbolic expressions between programs.
- [WSTPAPI](https://reference.wolfram.com/language/guide/WSTPAPI.html): Extensively used within the Wolfram System itself, the Wolfram Symbolic Transfer Protocol (WSTP) is the Wolfram System's unique high-level symbolic interface standard for interprogram communication. With convenient bindings for a variety of languages, WSTP immediately allows arbitrary symbolic objects—representing data, programs, or any other construct—to be efficiently exchanged between programs, on one computer or across a heterogeneous network.
- [WSTP C Language Functions](https://reference.wolfram.com/language/guide/WSTPCLanguageFunctions.html): The WSTP library provides a collection of C language functions for interacting with the Wolfram Language via WSTP. These functions allow you not only to handle native C data types, but also to construct and deconstruct full Wolfram Language symbolic expressions.

# What we provide

The official image[^4] is **only for the amd64 architecture**, therefore any attempt *to bind a foreign interface to `libWSTP64i4.so`*
fails if the user works in a different platform. 

We make this possible providing an image for the *arm64* architecture which has
the corresponding library that can be used in your bindings via the C language.
In particular, we have our own repository[^1] from which we build two images for both the *amd64[^2]* and *arm64[^3]* architectures, respectively: *both of them have in `/home/wolframengine/dist` both the `wstp.h` header and the `libWSTP64i4.so` shared library*.

At the time of writing, *it is not possible* to use the executables `wolframscript` and `wstpserver` from the *arm64* image
because of licensing problems, therefore the user interested in running a Wolfram server and talk to it via its own bindings
*has to use* the *amd64* image. For this reason, we have the following rule in our `Makefile`[^5]:
```makefile
wstpserver:
	docker run -it --rm \
		--entrypoint /usr/local/Wolfram/WolframEngine/${WOLFRAM_VERSION}/SystemFiles/Links/WSTPServer/wstpserver \
		-v ./Licensing:/home/wolframengine/.WolframEngine/Licensing \
		-v ./wstpserver.conf:/home/wolframengine/wstpserver.conf \
		-p ${WOLFRAM_PORT_FORWARD}:${WOLFRAM_DEFAULT_PORT} \
		ghcr.io/massimo-nocentini/wolframengine.docker:${WOLFRAM_VERSION}-amd64 \
		-c /home/wolframengine/wstpserver.conf
```
that allows us to have a running process to interact via some bindings, provided that the [free licence](https://www.wolfram.com/engine/free-license/) has been activated.

[^1]: {{< github "massimo-nocentini" "wolframengine.docker" >}}
[^2]: {{< docker "https://github.com/massimo-nocentini/wolframengine.docker/pkgs/container/wolframengine.docker" "wolframengine.docker:14.3-amd64" >}}
[^3]: {{< docker "https://github.com/massimo-nocentini/wolframengine.docker/pkgs/container/wolframengine.docker" "wolframengine.docker:14.3-arm64" >}}
[^4]: {{< docker "https://hub.docker.com/r/wolframresearch/wolframengine" "wolframengine:14.3" >}}
[^5]: {{< github "massimo-nocentini" "wolframengine.docker/blob/master/Makefile" >}}



