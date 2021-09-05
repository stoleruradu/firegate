#!/usr/bin/env node
import pkg from '../package.json';
import { bootstrap } from '../lib';

bootstrap({ name: pkg.name, version: pkg.version });
