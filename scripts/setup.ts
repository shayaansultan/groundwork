// Bootstraps a fresh clone. Run through `bun run setup`, which installs
// dependencies first; this script handles everything install does not.
import { $ } from 'bun'

for (const example of new Bun.Glob('apps/*/.env.example').scanSync('.')) {
  const target = example.replace(/\.env\.example$/, '.env')

  if (await Bun.file(target).exists()) {
    console.log(`kept     ${target}`)
  } else {
    await Bun.write(target, Bun.file(example))
    console.log(`created  ${target}`)
  }
}

const git = await $`git rev-parse --is-inside-work-tree`.nothrow().quiet()

if (git.exitCode === 0) {
  await $`git config core.hooksPath .githooks`
  console.log('hooks    core.hooksPath -> .githooks')
} else {
  console.log('hooks    skipped, not a git repository')
}
