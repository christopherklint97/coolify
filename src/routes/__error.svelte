<script context="module">
	/** @type {import('@sveltejs/kit').ErrorLoad} */
	export function load({ error, status }) {
		console.log(error);
		return {
			props: {
				error,
				status
			}
		};
	}
</script>

<script>
	import { t } from '$lib/translations';

	export let status;
	export let error;
</script>

<div class="mx-auto flex h-screen flex-col items-center justify-center px-4">
	<div class="pb-10 text-7xl font-bold">{status}</div>
	<div class="text-3xl font-bold">{$t('error.you_are_lost')}</div>
	<div class="text-xl">
		{$t('error.you_can_find_your_way_back')}
		<a href="/" class="font-bold uppercase text-sky-400">{$t('error.here')}</a>
	</div>
	<div class="py-10 text-xs font-bold">
		<pre
			class="w-full whitespace-pre-wrap break-words text-left text-xs tracking-tighter">{error.message} {error.stack}</pre>
	</div>
</div>
