#!/usr/bin/env python

import asyncio
import json
import logging
import websockets

logging.basicConfig()

TABLETOPS = {}

def get_tabletop(id):
    if not id in TABLETOPS:
        TABLETOPS[id] = {
            "value": 0,
            "tokens": {},
            "users": set(),
        }

    return TABLETOPS[id]


def state_event(tabletop):
    return json.dumps({"type": "state", "value": tabletop["value"], **tabletop["tokens"] })

def users_event(tabletop):
    return json.dumps({"type": "users", "count": len(tabletop["users"])})

def counter_event(tabletop):
    return json.dumps({"type": "state", "value": tabletop["value"]})

def token_event(tabletop, token_id):
    return json.dumps({"type": "state", token_id: tabletop["tokens"][token_id]})


async def notify_state(tabletop):
    if tabletop["users"]:  # asyncio.wait doesn't accept an empty list
        message = state_event(tabletop)
        await asyncio.wait([user.send(message) for user in tabletop["users"]])

async def notify_users(tabletop):
    if tabletop["users"]:  # asyncio.wait doesn't accept an empty list
        message = users_event(tabletop)
        await asyncio.wait([user.send(message) for user in tabletop["users"]])

async def notify_counter(tabletop):
    if tabletop["users"]:
        message = counter_event(tabletop)
        await asyncio.wait([user.send(message) for user in tabletop["users"]])

async def notify_token(tabletop, token_id):
    if tabletop["users"]:
        message = token_event(tabletop, token_id)
        await asyncio.wait([user.send(message) for user in tabletop["users"]])


async def register(websocket, path):
    tabletop = get_tabletop(path)
    tabletop["users"].add(websocket)
    await notify_users(tabletop)

async def unregister(websocket, path):
    tabletop = get_tabletop(path)
    tabletop["users"].remove(websocket)
    await notify_users(tabletop)

async def machine(websocket, path):
    if not path:
        logging.error("unsupported message")
        return
    else:
        tabletop = get_tabletop(path)

    await register(websocket, path)
    try:
        async for message in websocket:
            data = json.loads(message)
            if data["action"] == "minus":
                tabletop["value"] -= 1
                await notify_counter(tabletop)
            elif data["action"] == "plus":
                tabletop["value"] += 1
                await notify_counter(tabletop)
            elif data["action"] == "move":
                tabletop["tokens"][data["token"]] = data["target"]
                await notify_token(tabletop, data["token"])
            elif data["action"] == "ping":
                await notify_state(tabletop)
            else:
                logging.error("unsupported event: {}", data)
    finally:
        await unregister(websocket, path)


start_server = websockets.serve(machine, "127.0.0.1", 6789)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
