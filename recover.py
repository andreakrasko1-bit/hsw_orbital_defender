import json

transcript_path = r'C:\Users\andre\.gemini\antigravity\brain\6ec628e7-4af4-476b-85c4-542e33987afd\.system_generated\logs\transcript.jsonl'
best_game_content = ''
writes = []

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            entry = json.loads(line)
            if 'tool_calls' in entry:
                for call in entry['tool_calls']:
                    args = call.get('args', call.get('arguments', {}))
                    if not isinstance(args, dict): continue
                    
                    target_file = args.get('TargetFile', '')
                    if 'game.js' not in target_file: continue

                    name = call.get('name', '')
                    if name in ['write_to_file', 'default_api:write_to_file']:
                        val = args.get('CodeContent', '')
                        if val.startswith('"') and val.endswith('"'):
                            try: val = json.loads(val)
                            except: pass
                        writes.append({'file': target_file, 'len': len(val), 'content': val})
        except Exception as e:
            pass

for w in writes:
    print(f"Write to {w['file']} - len: {w['len']}")
    if w['len'] > len(best_game_content):
        best_game_content = w['content']

game_js_content = best_game_content
replaces = 0

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            entry = json.loads(line)
            if 'tool_calls' in entry:
                for call in entry['tool_calls']:
                    args = call.get('args', call.get('arguments', {}))
                    if not isinstance(args, dict): continue
                    
                    target_file = args.get('TargetFile', '')
                    if 'game.js' not in target_file: continue

                    name = call.get('name', '')
                    
                    if name in ['replace_file_content', 'default_api:replace_file_content']:
                        target = args.get('TargetContent', '')
                        if target.startswith('"'): 
                            try: target = json.loads(target)
                            except: pass
                        repl = args.get('ReplacementContent', '')
                        if repl.startswith('"'): 
                            try: repl = json.loads(repl)
                            except: pass
                        
                        if target in game_js_content:
                            game_js_content = game_js_content.replace(target, repl)
                            replaces += 1
                        else:
                            print("REPLACE FAILED target not found!")
                    
                    elif name in ['multi_replace_file_content', 'default_api:multi_replace_file_content']:
                        chunks_str = args.get('ReplacementChunks', '[]')
                        if isinstance(chunks_str, str):
                            try: chunks = json.loads(chunks_str)
                            except: chunks = []
                        else:
                            chunks = chunks_str
                        for chunk in chunks:
                            target = chunk.get('TargetContent', '')
                            if target.startswith('"'): 
                                try: target = json.loads(target)
                                except: pass
                            repl = chunk.get('ReplacementContent', '')
                            if repl.startswith('"'): 
                                try: repl = json.loads(repl)
                                except: pass
                                
                            if target in game_js_content:
                                game_js_content = game_js_content.replace(target, repl)
                                replaces += 1
                            else:
                                print("MULTI_REPLACE FAILED target not found!")
        except Exception as e:
            pass

game_js_content = game_js_content.replace('#00FF66', '#FF3344')
game_js_content = game_js_content.replace('rgba(0, 255, 102,', 'rgba(255, 51, 68,')
game_js_content = game_js_content.replace('#001a0a', '#1a0005')
game_js_content = game_js_content.replace('#00ccff', '#FFD700')
game_js_content = game_js_content.replace('rgba(0, 204, 255,', 'rgba(255, 215, 0,')
game_js_content = game_js_content.replace('#cc66ff', '#FFD700')
game_js_content = game_js_content.replace('rgba(204, 102, 255,', 'rgba(255, 215, 0,')

with open(r'c:\Users\andre\Desktop\open3\game.js', 'w', encoding='utf-8') as out:
    out.write(game_js_content)
print(f'Reconstructed game.js! Length: {len(game_js_content)}, Replaces: {replaces}')
