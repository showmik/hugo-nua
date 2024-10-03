+++
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
date = {{ .Date }}
draft = true
author = "{{ .Site.Params.author.name }}"
description = "Description of the content."
tags = []
+++
