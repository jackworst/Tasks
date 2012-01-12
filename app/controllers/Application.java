package controllers;

import play.*;
import play.db.jpa.*;
import play.mvc.*;

import java.lang.reflect.*;
import java.util.*;

import com.google.gson.*;

import models.*;

public class Application extends Controller {
	public static void index() {
		render();
	}

	public static void list(String query) {
		List<Item> items;

		if (query != null && !query.trim().isEmpty()) {
			items = Item.find("title like ? order by title, id", "%" + query.trim() + "%").fetch();
		} else {
			items = Item.find("order by title, id").fetch();
		}

		for (Item item : items) {
			stripItem(item);
		}

		renderJSON(items);
	}

	public static void getItem(Long id, boolean full) {
		Item item = Item.findById(id);

		if (!full) {
			stripItem(item);
		}

		renderJSON(item);
	}

	public static void setDone(Long id, boolean done) {
		Item item = Item.findById(id);
		item.done = done;
		item.save();

		renderJSON(item);
	}

	public static void updateItem(Long id, String title, String description) {
		Item item = Item.findById(id);
		item.title = title;
		item.description = description;
		item.save();

		renderJSON(item);
	}

	public static void deleteItem(Long id) {
		Item.delete("id", id);
	}

	public static void createItem(String title) {
		Item item = new Item();
		item.title = title;

		JPA.em().persist(item);

		renderJSON(item);
	}

	private static void stripItem(Item item) {
		// dirty way to drop the fields not needed for compact view
		item.description = null;
	}
}